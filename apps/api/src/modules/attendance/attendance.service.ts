import { Injectable, ConflictException, NotFoundException, ForbiddenException } from "@nestjs/common";
import { PrismaService } from "../../config/prisma.service";

interface BulkRecord {
  studentId: string;
  status: string;
  remark?: string;
}

@Injectable()
export class AttendanceService {
  constructor(private prisma: PrismaService) {}

  async listSessions(schoolId: string, sectionId?: string, date?: string, page = 1, pageSize = 20) {
    const where = {
      schoolId,
      ...(sectionId && { sectionId }),
      ...(date && { sessionDate: new Date(date) }),
    };

    const [data, total] = await Promise.all([
      this.prisma.attendanceSession.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          section: true,
          teacher: { include: { user: { select: { displayName: true } } } },
          _count: { select: { records: true } },
        },
        orderBy: [{ sessionDate: "desc" }, { periodNumber: "asc" }],
      }),
      this.prisma.attendanceSession.count({ where }),
    ]);

    return { data, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
  }

  async getRoster(sessionId: string, schoolId: string) {
    const session = await this.prisma.attendanceSession.findUnique({
      where: { id: sessionId },
      include: {
        section: true,
        teacher: { include: { user: { select: { displayName: true } } } },
        records: {
          include: {
            studentProfile: { select: { id: true, firstName: true, lastName: true, admissionNo: true } },
          },
          orderBy: { studentProfile: { firstName: "asc" } },
        },
      },
    });
    if (!session) throw new NotFoundException("Session not found");
    if (session.schoolId !== schoolId) throw new ForbiddenException();

    // If session not yet submitted, fetch all students in the section to show full roster
    if (!session.submittedAt) {
      const students = await this.prisma.studentProfile.findMany({
        where: { sectionId: session.sectionId, enrollmentStatus: "active" },
        select: { id: true, firstName: true, lastName: true, admissionNo: true },
        orderBy: { firstName: "asc" },
      });
      return { ...session, rosterStudents: students };
    }

    return session;
  }

  async openSession(sectionId: string, actingUserId: string, sessionDate: Date, periodNumber: number, schoolId: string) {
    const section = await this.prisma.section.findUnique({ where: { id: sectionId } });
    if (!section || section.schoolId !== schoolId) throw new ForbiddenException();

    const existing = await this.prisma.attendanceSession.findUnique({
      where: { sectionId_sessionDate_periodNumber: { sectionId, sessionDate, periodNumber } },
    });
    if (existing) throw new ConflictException("Session already exists for this period");

    // Resolve actingUserId → staffProfile (if the user has one; optional FK)
    const staffProfile = await this.prisma.staffProfile.findUnique({ where: { userId: actingUserId } });

    return this.prisma.attendanceSession.create({
      data: { schoolId, sectionId, teacherId: staffProfile?.id ?? null, sessionDate, periodNumber },
      include: { section: true },
    });
  }

  async bulkSubmit(sessionId: string, records: BulkRecord[], _actingUserId: string) {
    const session = await this.prisma.attendanceSession.findUnique({
      where: { id: sessionId },
      include: { section: true },
    });
    if (!session) throw new NotFoundException("Session not found");
    if (session.submittedAt) throw new ConflictException("Session already submitted");

    return this.prisma.$transaction(async (tx) => {
      await tx.attendanceRecord.createMany({
        data: records.map((r) => ({
          attendanceSessionId: sessionId,
          studentProfileId: r.studentId,
          status: r.status,
          remark: r.remark,
        })),
        skipDuplicates: true,
      });

      await tx.attendanceSession.update({
        where: { id: sessionId },
        data: { submittedAt: new Date() },
      });

      const breakdown: Record<string, number> = {};
      for (const r of records) {
        breakdown[r.status] = (breakdown[r.status] ?? 0) + 1;
      }

      return { sessionId, submittedCount: records.length, statusBreakdown: breakdown, submittedAt: new Date() };
    });
  }
}
