import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../config/prisma.service";

@Injectable()
export class AnalyticsService {
  constructor(private prisma: PrismaService) {}

  // ── Admin KPI overview ─────────────────────────────────────────────────────

  async getOverview(schoolId: string) {
    const today = new Date();
    const todayStart = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
    const todayEnd = new Date(todayStart.getTime() + 86_400_000);

    const [
      totalStudents,
      presentToday,
      pendingFees,
      activeAnnouncements,
      totalStaff,
      totalCourses,
    ] = await Promise.all([
      this.prisma.studentProfile.count({ where: { schoolId, enrollmentStatus: "active" } }),
      this.prisma.attendanceRecord.count({
        where: {
          status: "present",
          session: { schoolId, sessionDate: { gte: todayStart, lt: todayEnd } },
        },
      }),
      this.prisma.feeInvoice.count({
        where: { feePlan: { schoolId }, status: { in: ["pending", "partial"] } },
      }),
      this.prisma.announcement.count({
        where: { schoolId, isPublished: true, expiresAt: { gte: new Date() } },
      }),
      this.prisma.staffProfile.count({ where: { schoolId, isActive: true } }),
      this.prisma.course.count({ where: { schoolId, isActive: true } }),
    ]);

    return {
      totalStudents,
      presentToday,
      pendingFees,
      activeAnnouncements,
      totalStaff,
      totalCourses,
    };
  }

  // ── Attendance report ──────────────────────────────────────────────────────

  async getAttendanceReport(
    schoolId: string,
    opts: { sectionId?: string; from?: string; to?: string },
  ) {
    const from = opts.from ? new Date(opts.from) : new Date(Date.now() - 30 * 86_400_000);
    const to = opts.to ? new Date(opts.to) : new Date();

    const sessions = await this.prisma.attendanceSession.findMany({
      where: {
        schoolId,
        sessionDate: { gte: from, lte: to },
        ...(opts.sectionId && { sectionId: opts.sectionId }),
        submittedAt: { not: null },
      },
      include: {
        section: { select: { name: true } },
        records: { select: { status: true } },
      },
      orderBy: { sessionDate: "asc" },
    });

    const rows = sessions.map((s) => {
      const total = s.records.length;
      const present = s.records.filter((r) => r.status === "present").length;
      const absent = s.records.filter((r) => r.status === "absent").length;
      const late = s.records.filter((r) => r.status === "late").length;
      const rate = total > 0 ? Math.round((present / total) * 100) : 0;

      return {
        sessionId: s.id,
        sectionName: s.section.name,
        sessionDate: s.sessionDate,
        periodNumber: s.periodNumber,
        total,
        present,
        absent,
        late,
        attendanceRate: rate,
      };
    });

    const overallTotal = rows.reduce((a, r) => a + r.total, 0);
    const overallPresent = rows.reduce((a, r) => a + r.present, 0);
    const overallRate = overallTotal > 0 ? Math.round((overallPresent / overallTotal) * 100) : 0;

    return { rows, summary: { sessions: rows.length, overallTotal, overallPresent, overallRate } };
  }

  // ── Academic performance report ────────────────────────────────────────────

  async getAcademicReport(schoolId: string, opts: { sectionId?: string; term?: string }) {
    const exams = await this.prisma.exam.findMany({
      where: {
        isPublished: true,
        courseOffering: {
          section: { schoolId },
          ...(opts.sectionId && { sectionId: opts.sectionId }),
          ...(opts.term && { academicTerm: opts.term }),
        },
      },
      include: {
        courseOffering: {
          include: {
            course: { select: { code: true, name: true } },
            section: { select: { name: true } },
          },
        },
        results: { select: { marksObtained: true } },
      },
    });

    const rows = exams.map((e) => {
      const scored = e.results.filter((r) => r.marksObtained != null);
      const avg =
        scored.length > 0
          ? scored.reduce((a, r) => a + (r.marksObtained ?? 0), 0) / scored.length
          : null;
      const pct = avg != null && e.maxMarks > 0 ? Math.round((avg / e.maxMarks) * 100) : null;

      return {
        examId: e.id,
        examTitle: e.title,
        examType: e.examType,
        term: e.term,
        courseCode: e.courseOffering.course.code,
        courseName: e.courseOffering.course.name,
        sectionName: e.courseOffering.section.name,
        maxMarks: e.maxMarks,
        totalStudents: e.results.length,
        avgMarks: avg != null ? Math.round(avg * 10) / 10 : null,
        avgPercent: pct,
      };
    });

    return { rows };
  }

  // ── Finance report ─────────────────────────────────────────────────────────

  async getFinanceReport(schoolId: string, opts: { from?: string; to?: string }) {
    const from = opts.from ? new Date(opts.from) : new Date(Date.now() - 180 * 86_400_000);
    const to = opts.to ? new Date(opts.to) : new Date();

    const payments = await this.prisma.payment.findMany({
      where: {
        status: "completed",
        paidAt: { gte: from, lte: to },
        feeInvoice: { feePlan: { schoolId } },
      },
      select: { amount: true, method: true, paidAt: true },
      orderBy: { paidAt: "asc" },
    });

    // group by year-month
    const byMonth: Record<string, { month: string; collected: number; transactions: number }> = {};
    for (const p of payments) {
      const d = p.paidAt ?? new Date();
      const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
      if (!byMonth[key]) byMonth[key] = { month: key, collected: 0, transactions: 0 };
      byMonth[key].collected += p.amount;
      byMonth[key].transactions += 1;
    }

    const byMethod: Record<string, number> = {};
    for (const p of payments) {
      byMethod[p.method] = (byMethod[p.method] ?? 0) + p.amount;
    }

    const totalCollected = payments.reduce((a, p) => a + p.amount, 0);

    const [pendingCount, overdueCount] = await Promise.all([
      this.prisma.feeInvoice.count({ where: { feePlan: { schoolId }, status: "pending" } }),
      this.prisma.feeInvoice.count({
        where: {
          feePlan: { schoolId },
          status: { in: ["pending", "partial"] },
          dueDate: { lt: new Date() },
        },
      }),
    ]);

    return {
      rows: Object.values(byMonth),
      byMethod,
      summary: {
        totalCollected,
        totalTransactions: payments.length,
        pendingCount,
        overdueCount,
      },
    };
  }

  // ── CSV export stubs ───────────────────────────────────────────────────────

  async exportAttendanceCsv(schoolId: string, opts: { sectionId?: string; from?: string; to?: string }) {
    const report = await this.getAttendanceReport(schoolId, opts);
    const header = "Session Date,Section,Period,Total,Present,Absent,Late,Attendance Rate %\n";
    const lines = report.rows.map((r) =>
      [
        new Date(r.sessionDate).toISOString().split("T")[0],
        `"${r.sectionName}"`,
        r.periodNumber,
        r.total,
        r.present,
        r.absent,
        r.late,
        r.attendanceRate,
      ].join(","),
    );
    return header + lines.join("\n");
  }

  async exportAcademicCsv(schoolId: string, opts: { sectionId?: string; term?: string }) {
    const report = await this.getAcademicReport(schoolId, opts);
    const header = "Exam,Type,Term,Course Code,Course Name,Section,Max Marks,Students,Avg Marks,Avg %\n";
    const lines = report.rows.map((r) =>
      [
        `"${r.examTitle}"`,
        r.examType,
        r.term,
        r.courseCode,
        `"${r.courseName}"`,
        `"${r.sectionName}"`,
        r.maxMarks,
        r.totalStudents,
        r.avgMarks ?? "",
        r.avgPercent ?? "",
      ].join(","),
    );
    return header + lines.join("\n");
  }

  async exportFinanceCsv(schoolId: string, opts: { from?: string; to?: string }) {
    const report = await this.getFinanceReport(schoolId, opts);
    const header = "Month,Collected,Transactions\n";
    const lines = report.rows.map((r) =>
      [r.month, r.collected, r.transactions].join(","),
    );
    return header + lines.join("\n");
  }
}
