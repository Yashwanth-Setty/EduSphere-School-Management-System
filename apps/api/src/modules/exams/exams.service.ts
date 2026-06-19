import { Injectable, NotFoundException, ForbiddenException } from "@nestjs/common";
import { PrismaService } from "../../config/prisma.service";
import { CreateExamDto } from "./dto/create-exam.dto";
import { UpdateExamDto } from "./dto/update-exam.dto";
import { EnterResultsDto } from "./dto/enter-results.dto";

@Injectable()
export class ExamsService {
  constructor(private prisma: PrismaService) {}

  private async verifyExam(id: string, schoolId: string) {
    const exam = await this.prisma.exam.findUnique({
      where: { id },
      include: { courseOffering: { include: { course: { select: { schoolId: true } } } } },
    });
    if (!exam) throw new NotFoundException("Exam not found");
    if (exam.courseOffering.course.schoolId !== schoolId) throw new ForbiddenException();
    return exam;
  }

  async findAll(schoolId: string, courseOfferingId?: string, page = 1, pageSize = 20) {
    const offeringIds = courseOfferingId
      ? [courseOfferingId]
      : (
          await this.prisma.courseOffering.findMany({
            where: { course: { schoolId } },
            select: { id: true },
          })
        ).map((o) => o.id);

    const where = { courseOfferingId: { in: offeringIds } };

    const [data, total] = await Promise.all([
      this.prisma.exam.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          courseOffering: {
            include: {
              course: { select: { code: true, name: true } },
              section: { select: { name: true } },
            },
          },
          _count: { select: { results: true } },
        },
        orderBy: [{ examDate: "asc" }, { createdAt: "desc" }],
      }),
      this.prisma.exam.count({ where }),
    ]);

    return { data, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
  }

  async findOne(id: string, schoolId: string) {
    const exam = await this.prisma.exam.findUnique({
      where: { id },
      include: {
        courseOffering: {
          include: {
            course: { select: { code: true, name: true, schoolId: true } },
            section: { select: { name: true } },
            teacher: { include: { user: { select: { displayName: true } } } },
          },
        },
        _count: { select: { results: true } },
      },
    });
    if (!exam) throw new NotFoundException("Exam not found");
    if (exam.courseOffering.course.schoolId !== schoolId) throw new ForbiddenException();
    return exam;
  }

  async create(dto: CreateExamDto, schoolId: string) {
    const offering = await this.prisma.courseOffering.findUnique({
      where: { id: dto.courseOfferingId },
      include: { course: { select: { schoolId: true } } },
    });
    if (!offering) throw new NotFoundException("Course offering not found");
    if (offering.course.schoolId !== schoolId) throw new ForbiddenException();

    return this.prisma.exam.create({
      data: {
        courseOfferingId: dto.courseOfferingId,
        academicYearId: dto.academicYearId,
        title: dto.title,
        examType: dto.examType,
        term: dto.term,
        weight: dto.weight ?? 1.0,
        maxMarks: dto.maxMarks,
        examDate: dto.examDate ? new Date(dto.examDate) : undefined,
        isPublished: dto.isPublished ?? false,
      },
    });
  }

  async update(id: string, dto: UpdateExamDto, schoolId: string) {
    await this.verifyExam(id, schoolId);
    return this.prisma.exam.update({
      where: { id },
      data: {
        ...(dto.title !== undefined && { title: dto.title }),
        ...(dto.examType !== undefined && { examType: dto.examType }),
        ...(dto.term !== undefined && { term: dto.term }),
        ...(dto.weight !== undefined && { weight: dto.weight }),
        ...(dto.maxMarks !== undefined && { maxMarks: dto.maxMarks }),
        ...(dto.examDate !== undefined && { examDate: dto.examDate ? new Date(dto.examDate) : null }),
        ...(dto.isPublished !== undefined && {
          isPublished: dto.isPublished,
          publishedAt: dto.isPublished ? new Date() : null,
        }),
      },
    });
  }

  async getResults(examId: string, schoolId: string) {
    await this.verifyExam(examId, schoolId);
    return this.prisma.examResult.findMany({
      where: { examId },
      include: {
        studentProfile: { select: { admissionNo: true, firstName: true, lastName: true } },
      },
      orderBy: { studentProfile: { firstName: "asc" } },
    });
  }

  async getMyResult(examId: string, userId: string) {
    const profile = await this.prisma.studentProfile.findUnique({ where: { userId } });
    if (!profile) return null;
    return this.prisma.examResult.findUnique({
      where: { examId_studentProfileId: { examId, studentProfileId: profile.id } },
    });
  }

  async upsertResults(examId: string, dto: EnterResultsDto, schoolId: string) {
    await this.verifyExam(examId, schoolId);
    const ops = dto.results.map((r) =>
      this.prisma.examResult.upsert({
        where: { examId_studentProfileId: { examId, studentProfileId: r.studentProfileId } },
        update: {
          marksObtained: r.marksObtained,
          grade: r.grade,
          remarks: r.remarks,
          updatedAt: new Date(),
        },
        create: {
          examId,
          studentProfileId: r.studentProfileId,
          marksObtained: r.marksObtained,
          grade: r.grade,
          remarks: r.remarks,
        },
      }),
    );
    return this.prisma.$transaction(ops);
  }
}
