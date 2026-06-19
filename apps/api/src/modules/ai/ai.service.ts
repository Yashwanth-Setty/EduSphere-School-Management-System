import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../config/prisma.service";

const FEATURE_FLAG = "ai_insights";

@Injectable()
export class AiService {
  constructor(private prisma: PrismaService) {}

  // ── Attendance risk scoring ────────────────────────────────────────────────
  // Scores every active student in the school over the last 30 days.
  // Existing recommendations for the same student are upserted by deleting first.

  async runAttendanceRisk(schoolId: string, actingUserId: string) {
    const since = new Date(Date.now() - 30 * 86_400_000);

    const students = await this.prisma.studentProfile.findMany({
      where: { schoolId, enrollmentStatus: "active" },
      select: { id: true, firstName: true, lastName: true, admissionNo: true },
    });

    if (students.length === 0) return { processed: 0, created: 0 };

    const studentIds = students.map((s) => s.id);

    // fetch all attendance records for those students in the window
    const records = await this.prisma.attendanceRecord.findMany({
      where: {
        studentProfileId: { in: studentIds },
        session: { schoolId, sessionDate: { gte: since }, submittedAt: { not: null } },
      },
      select: { studentProfileId: true, status: true },
    });

    // aggregate per student
    const byStudent: Record<string, { total: number; present: number }> = {};
    for (const r of records) {
      if (!byStudent[r.studentProfileId]) byStudent[r.studentProfileId] = { total: 0, present: 0 };
      byStudent[r.studentProfileId].total += 1;
      if (r.status === "present") byStudent[r.studentProfileId].present += 1;
    }

    // delete existing attendance_risk recommendations for these students
    await this.prisma.aiRecommendation.deleteMany({
      where: { recommendationType: "attendance_risk", targetId: { in: studentIds } },
    });

    const toCreate = students
      .filter((s) => (byStudent[s.id]?.total ?? 0) >= 5) // need at least 5 sessions to score
      .map((s) => {
        const stats = byStudent[s.id] ?? { total: 0, present: 0 };
        const rate = stats.total > 0 ? stats.present / stats.total : 1;
        const riskLevel = rate < 0.75 ? "high" : rate < 0.85 ? "medium" : "low";
        const pct = Math.round(rate * 100);

        let content = "";
        if (riskLevel === "high")
          content = `${s.firstName} ${s.lastName} has a ${pct}% attendance rate over the last 30 days — below the 75% threshold. Immediate follow-up recommended.`;
        else if (riskLevel === "medium")
          content = `${s.firstName} ${s.lastName} has a ${pct}% attendance rate — approaching the risk threshold. Monitor closely.`;
        else
          content = `${s.firstName} ${s.lastName} has a healthy ${pct}% attendance rate.`;

        return {
          targetType: "student",
          targetId: s.id,
          recommendationType: "attendance_risk",
          content,
          confidence: rate,
          sourceRange: { schoolId, admissionNo: s.admissionNo, rate: pct, riskLevel, sessions: stats.total },
          featureFlag: FEATURE_FLAG,
        };
      });

    let created = 0;
    if (toCreate.length > 0) {
      const result = await this.prisma.aiRecommendation.createMany({ data: toCreate });
      created = result.count;
    }

    await this.prisma.auditLog.create({
      data: {
        schoolId,
        userId: actingUserId,
        action: "ai.attendance_risk.run",
        entityType: "ai_recommendation",
        metadata: { processed: students.length, created, since: since.toISOString() },
      },
    });

    return { processed: students.length, created };
  }

  // ── Performance summary generator ─────────────────────────────────────────
  // Summarises published exam results for each student.

  async runPerformanceSummary(schoolId: string, actingUserId: string) {
    const students = await this.prisma.studentProfile.findMany({
      where: { schoolId, enrollmentStatus: "active" },
      select: { id: true, firstName: true, lastName: true, admissionNo: true },
    });

    if (students.length === 0) return { processed: 0, created: 0 };

    const studentIds = students.map((s) => s.id);

    const results = await this.prisma.examResult.findMany({
      where: {
        studentProfileId: { in: studentIds },
        marksObtained: { not: null },
        exam: { isPublished: true, courseOffering: { section: { schoolId } } },
      },
      select: {
        studentProfileId: true,
        marksObtained: true,
        exam: { select: { maxMarks: true, title: true } },
      },
    });

    const byStudent: Record<string, { pcts: number[]; exams: string[] }> = {};
    for (const r of results) {
      if (!byStudent[r.studentProfileId]) byStudent[r.studentProfileId] = { pcts: [], exams: [] };
      const pct = r.exam.maxMarks > 0 ? ((r.marksObtained ?? 0) / r.exam.maxMarks) * 100 : 0;
      byStudent[r.studentProfileId].pcts.push(pct);
      byStudent[r.studentProfileId].exams.push(r.exam.title);
    }

    await this.prisma.aiRecommendation.deleteMany({
      where: { recommendationType: "performance_summary", targetId: { in: studentIds } },
    });

    const toCreate = students
      .filter((s) => (byStudent[s.id]?.pcts.length ?? 0) > 0)
      .map((s) => {
        const { pcts, exams } = byStudent[s.id];
        const avg = pcts.reduce((a, b) => a + b, 0) / pcts.length;
        const avgRounded = Math.round(avg * 10) / 10;
        const trend = avg >= 75 ? "performing well" : avg >= 50 ? "performing adequately" : "struggling";

        const content =
          `${s.firstName} ${s.lastName} is ${trend} with an average score of ${avgRounded}% across ${pcts.length} exam(s). ` +
          (avg < 50
            ? "Academic support or counsellor review is suggested."
            : avg >= 85
            ? "Continue to encourage and challenge this student."
            : "Monitor progress regularly.");

        return {
          targetType: "student",
          targetId: s.id,
          recommendationType: "performance_summary",
          content,
          confidence: avg / 100,
          sourceRange: {
            schoolId,
            admissionNo: s.admissionNo,
            avgPercent: avgRounded,
            examCount: pcts.length,
            exams,
          },
          featureFlag: FEATURE_FLAG,
        };
      });

    let created = 0;
    if (toCreate.length > 0) {
      const result = await this.prisma.aiRecommendation.createMany({ data: toCreate });
      created = result.count;
    }

    await this.prisma.auditLog.create({
      data: {
        schoolId,
        userId: actingUserId,
        action: "ai.performance_summary.run",
        entityType: "ai_recommendation",
        metadata: { processed: students.length, created },
      },
    });

    return { processed: students.length, created };
  }

  // ── List recommendations ───────────────────────────────────────────────────

  async listRecommendations(
    schoolId: string,
    opts: { type?: string; page: number; pageSize: number },
  ) {
    const { type, page, pageSize } = opts;

    // resolve student IDs for this school to scope recommendations
    const profiles = await this.prisma.studentProfile.findMany({
      where: { schoolId },
      select: { id: true, firstName: true, lastName: true, admissionNo: true },
    });
    const profileMap = new Map(profiles.map((p) => [p.id, p]));
    const studentIds = profiles.map((p) => p.id);

    const where = {
      targetId: { in: studentIds },
      ...(type && { recommendationType: type }),
    };

    const [data, total] = await Promise.all([
      this.prisma.aiRecommendation.findMany({
        where,
        orderBy: { generatedAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.aiRecommendation.count({ where }),
    ]);

    const enriched = data.map((r) => ({
      ...r,
      student: profileMap.get(r.targetId) ?? null,
    }));

    return { data: enriched, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
  }

  // ── Student insights ───────────────────────────────────────────────────────

  async getStudentInsights(studentProfileId: string) {
    return this.prisma.aiRecommendation.findMany({
      where: { targetId: studentProfileId },
      orderBy: { generatedAt: "desc" },
    });
  }

  // ── AI audit logs ──────────────────────────────────────────────────────────

  async getAiAuditLogs(schoolId: string, opts: { page: number; pageSize: number }) {
    const { page, pageSize } = opts;
    const where = { schoolId, action: { startsWith: "ai." } };

    const [data, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: { user: { select: { displayName: true, email: true } } },
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return { data, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
  }
}
