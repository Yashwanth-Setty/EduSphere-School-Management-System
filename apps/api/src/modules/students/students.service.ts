import { Injectable, ConflictException, NotFoundException, ForbiddenException } from "@nestjs/common";
import { PrismaService } from "../../config/prisma.service";
import { CreateStudentDto } from "./dto/create-student.dto";
import * as bcrypt from "bcryptjs";

@Injectable()
export class StudentsService {
  constructor(private prisma: PrismaService) {}

  async findAll(schoolId: string, page = 1, pageSize = 20, search?: string) {
    const where = {
      schoolId,
      ...(search && {
        OR: [
          { firstName: { contains: search, mode: "insensitive" as const } },
          { lastName: { contains: search, mode: "insensitive" as const } },
          { admissionNo: { contains: search, mode: "insensitive" as const } },
        ],
      }),
    };

    const [data, total] = await Promise.all([
      this.prisma.studentProfile.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: { section: true, user: { select: { email: true } } },
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.studentProfile.count({ where }),
    ]);

    return { data, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
  }

  async findOne(id: string, actingSchoolId: string) {
    const student = await this.prisma.studentProfile.findUnique({
      where: { id },
      include: {
        section: true,
        user: { select: { email: true, isActive: true } },
        parentLinks: { include: { parentProfile: { include: { user: { select: { displayName: true } } } } } },
      },
    });
    if (!student) throw new NotFoundException("Student not found");
    if (student.schoolId !== actingSchoolId) throw new ForbiddenException();
    return student;
  }

  async create(dto: CreateStudentDto, actingUserId: string) {
    const existing = await this.prisma.studentProfile.findUnique({
      where: { schoolId_admissionNo: { schoolId: dto.schoolId, admissionNo: dto.admissionNo } },
    });
    if (existing) throw new ConflictException("Admission number already exists");

    const tempPassword = `Spira@${Math.random().toString(36).slice(-8)}`;
    const passwordHash = await bcrypt.hash(tempPassword, 12);

    const studentRole = await this.prisma.role.findUnique({ where: { name: "student" } });

    const result = await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          schoolId: dto.schoolId,
          email: dto.email ?? `${dto.admissionNo.toLowerCase()}@student.spira`,
          displayName: `${dto.firstName} ${dto.lastName}`,
          passwordHash,
          ...(studentRole && { userRoles: { create: { roleId: studentRole.id } } }),
        },
      });

      const student = await tx.studentProfile.create({
        data: {
          userId: user.id,
          schoolId: dto.schoolId,
          sectionId: dto.sectionId,
          admissionNo: dto.admissionNo,
          firstName: dto.firstName,
          lastName: dto.lastName,
          dob: new Date(dto.dob),
          gender: dto.gender,
        },
      });

      await tx.auditLog.create({
        data: {
          schoolId: dto.schoolId,
          userId: actingUserId,
          action: "students.create",
          entityType: "student_profile",
          entityId: student.id,
        },
      });

      return student;
    });

    return result;
  }
}
