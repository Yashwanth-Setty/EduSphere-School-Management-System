import { Injectable, ConflictException, NotFoundException, ForbiddenException } from "@nestjs/common";
import { PrismaService } from "../../config/prisma.service";
import { CreateCourseDto } from "./dto/create-course.dto";
import { UpdateCourseDto } from "./dto/update-course.dto";
import { CreateOfferingDto } from "./dto/create-offering.dto";

@Injectable()
export class CoursesService {
  constructor(private prisma: PrismaService) {}

  async findAll(schoolId: string, page = 1, pageSize = 20, search?: string, activeOnly = false) {
    const where = {
      schoolId,
      ...(activeOnly && { isActive: true }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: "insensitive" as const } },
          { code: { contains: search, mode: "insensitive" as const } },
        ],
      }),
    };

    const [data, total] = await Promise.all([
      this.prisma.course.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: { _count: { select: { offerings: true } } },
        orderBy: { name: "asc" },
      }),
      this.prisma.course.count({ where }),
    ]);

    return { data, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
  }

  async findOne(id: string, schoolId: string) {
    const course = await this.prisma.course.findUnique({
      where: { id },
      include: {
        offerings: {
          include: {
            section: true,
            teacher: { include: { user: { select: { displayName: true } } } },
          },
        },
      },
    });
    if (!course) throw new NotFoundException("Course not found");
    if (course.schoolId !== schoolId) throw new ForbiddenException();
    return course;
  }

  async create(dto: CreateCourseDto) {
    const existing = await this.prisma.course.findUnique({
      where: { schoolId_code: { schoolId: dto.schoolId, code: dto.code } },
    });
    if (existing) throw new ConflictException("Course code already exists");

    return this.prisma.course.create({
      data: {
        schoolId: dto.schoolId,
        code: dto.code,
        name: dto.name,
        description: dto.description,
      },
    });
  }

  async update(id: string, dto: UpdateCourseDto, schoolId: string) {
    const course = await this.prisma.course.findUnique({ where: { id } });
    if (!course) throw new NotFoundException("Course not found");
    if (course.schoolId !== schoolId) throw new ForbiddenException();

    return this.prisma.course.update({ where: { id }, data: dto });
  }

  async addOffering(courseId: string, dto: CreateOfferingDto, schoolId: string) {
    const course = await this.prisma.course.findUnique({ where: { id: courseId } });
    if (!course) throw new NotFoundException("Course not found");
    if (course.schoolId !== schoolId) throw new ForbiddenException();

    const existing = await this.prisma.courseOffering.findUnique({
      where: { courseId_sectionId_academicTerm: { courseId, sectionId: dto.sectionId, academicTerm: dto.academicTerm } },
    });
    if (existing) throw new ConflictException("Offering already exists for this section and term");

    return this.prisma.courseOffering.create({
      data: { courseId, sectionId: dto.sectionId, teacherId: dto.teacherId, academicTerm: dto.academicTerm },
      include: { section: true, teacher: { include: { user: { select: { displayName: true } } } } },
    });
  }
}
