import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  ConflictException,
} from "@nestjs/common";
import { PrismaService } from "../../config/prisma.service";
import { CreateAssignmentDto } from "./dto/create-assignment.dto";
import { UpdateAssignmentDto } from "./dto/update-assignment.dto";
import { GradeSubmissionDto } from "./dto/grade-submission.dto";
import { SubmitAssignmentDto } from "./dto/submit-assignment.dto";

@Injectable()
export class AssignmentsService {
  constructor(private prisma: PrismaService) {}

  private async verifyOffering(courseOfferingId: string, schoolId: string) {
    const offering = await this.prisma.courseOffering.findUnique({
      where: { id: courseOfferingId },
      include: { course: { select: { schoolId: true } } },
    });
    if (!offering) throw new NotFoundException("Course offering not found");
    if (offering.course.schoolId !== schoolId) throw new ForbiddenException();
    return offering;
  }

  private async verifyAssignment(id: string, schoolId: string) {
    const assignment = await this.prisma.assignment.findUnique({
      where: { id },
      include: { courseOffering: { include: { course: { select: { schoolId: true } } } } },
    });
    if (!assignment) throw new NotFoundException("Assignment not found");
    if (assignment.courseOffering.course.schoolId !== schoolId) throw new ForbiddenException();
    return assignment;
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
      this.prisma.assignment.findMany({
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
          _count: { select: { submissions: true } },
        },
        orderBy: { dueDate: "asc" },
      }),
      this.prisma.assignment.count({ where }),
    ]);

    return { data, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
  }

  async findOne(id: string, schoolId: string) {
    const assignment = await this.prisma.assignment.findUnique({
      where: { id },
      include: {
        courseOffering: {
          include: {
            course: { select: { code: true, name: true, schoolId: true } },
            section: { select: { name: true } },
            teacher: { include: { user: { select: { displayName: true } } } },
          },
        },
        _count: { select: { submissions: true } },
      },
    });
    if (!assignment) throw new NotFoundException("Assignment not found");
    if (assignment.courseOffering.course.schoolId !== schoolId) throw new ForbiddenException();
    return assignment;
  }

  async create(dto: CreateAssignmentDto, schoolId: string) {
    await this.verifyOffering(dto.courseOfferingId, schoolId);
    return this.prisma.assignment.create({
      data: {
        courseOfferingId: dto.courseOfferingId,
        title: dto.title,
        instructions: dto.instructions,
        dueDate: new Date(dto.dueDate),
        maxScore: dto.maxScore,
        isPublished: dto.isPublished ?? false,
      },
    });
  }

  async update(id: string, dto: UpdateAssignmentDto, schoolId: string) {
    await this.verifyAssignment(id, schoolId);
    return this.prisma.assignment.update({
      where: { id },
      data: {
        ...(dto.title !== undefined && { title: dto.title }),
        ...(dto.instructions !== undefined && { instructions: dto.instructions }),
        ...(dto.dueDate !== undefined && { dueDate: new Date(dto.dueDate) }),
        ...(dto.maxScore !== undefined && { maxScore: dto.maxScore }),
        ...(dto.isPublished !== undefined && { isPublished: dto.isPublished }),
      },
    });
  }

  async getSubmissions(assignmentId: string, schoolId: string) {
    await this.verifyAssignment(assignmentId, schoolId);
    return this.prisma.submission.findMany({
      where: { assignmentId },
      include: {
        studentProfile: {
          select: { admissionNo: true, firstName: true, lastName: true },
        },
      },
      orderBy: { studentProfile: { firstName: "asc" } },
    });
  }

  async getStudentProfileId(userId: string): Promise<string | null> {
    const p = await this.prisma.studentProfile.findUnique({ where: { userId }, select: { id: true } });
    return p?.id ?? null;
  }

  async getMySubmission(assignmentId: string, studentProfileId: string) {
    return this.prisma.submission.findUnique({
      where: { assignmentId_studentProfileId: { assignmentId, studentProfileId } },
    });
  }

  async submit(assignmentId: string, studentProfileId: string, dto: SubmitAssignmentDto) {
    const assignment = await this.prisma.assignment.findUnique({ where: { id: assignmentId } });
    if (!assignment) throw new NotFoundException("Assignment not found");
    if (!assignment.isPublished) throw new ForbiddenException("Assignment is not published");

    const existing = await this.prisma.submission.findUnique({
      where: { assignmentId_studentProfileId: { assignmentId, studentProfileId } },
    });
    if (existing?.status === "graded") throw new ConflictException("Submission already graded");

    if (existing) {
      return this.prisma.submission.update({
        where: { id: existing.id },
        data: { fileUrl: dto.fileUrl, submittedAt: new Date(), status: "submitted" },
      });
    }

    return this.prisma.submission.create({
      data: {
        assignmentId,
        studentProfileId,
        fileUrl: dto.fileUrl,
        submittedAt: new Date(),
        status: "submitted",
      },
    });
  }

  async gradeSubmission(submissionId: string, dto: GradeSubmissionDto, schoolId: string) {
    const submission = await this.prisma.submission.findUnique({
      where: { id: submissionId },
      include: {
        assignment: {
          include: { courseOffering: { include: { course: { select: { schoolId: true } } } } },
        },
      },
    });
    if (!submission) throw new NotFoundException("Submission not found");
    if (submission.assignment.courseOffering.course.schoolId !== schoolId) throw new ForbiddenException();
    if (dto.grade !== undefined && submission.assignment.maxScore !== null) {
      if (dto.grade > (submission.assignment.maxScore ?? Infinity)) {
        throw new BadRequestException(`Grade cannot exceed maxScore of ${submission.assignment.maxScore}`);
      }
    }
    return this.prisma.submission.update({
      where: { id: submissionId },
      data: { grade: dto.grade, feedback: dto.feedback, status: "graded" },
    });
  }
}
