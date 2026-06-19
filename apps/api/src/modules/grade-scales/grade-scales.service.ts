import { Injectable, NotFoundException, ForbiddenException } from "@nestjs/common";
import { PrismaService } from "../../config/prisma.service";
import { CreateGradeScaleDto } from "./dto/create-grade-scale.dto";

@Injectable()
export class GradeScalesService {
  constructor(private prisma: PrismaService) {}

  async findAll(schoolId: string, gradeLevelId?: string) {
    const gradeLevelIds = gradeLevelId
      ? [gradeLevelId]
      : (
          await this.prisma.gradeLevel.findMany({
            where: { schoolId },
            select: { id: true },
          })
        ).map((g) => g.id);

    return this.prisma.gradeScale.findMany({
      where: { gradeLevelId: { in: gradeLevelIds } },
      include: { gradeLevel: { select: { name: true } } },
      orderBy: [{ gradeLevelId: "asc" }, { minPercent: "desc" }],
    });
  }

  async findGradeLevels(schoolId: string) {
    return this.prisma.gradeLevel.findMany({
      where: { schoolId },
      orderBy: { displayOrder: "asc" },
    });
  }

  async create(dto: CreateGradeScaleDto, schoolId: string) {
    const level = await this.prisma.gradeLevel.findUnique({ where: { id: dto.gradeLevelId } });
    if (!level) throw new NotFoundException("Grade level not found");
    if (level.schoolId !== schoolId) throw new ForbiddenException();

    return this.prisma.gradeScale.create({
      data: {
        gradeLevelId: dto.gradeLevelId,
        gradeLabel: dto.gradeLabel,
        minPercent: dto.minPercent,
        maxPercent: dto.maxPercent,
        gradePoint: dto.gradePoint,
        description: dto.description,
      },
      include: { gradeLevel: { select: { name: true } } },
    });
  }

  async remove(id: string, schoolId: string) {
    const scale = await this.prisma.gradeScale.findUnique({
      where: { id },
      include: { gradeLevel: { select: { schoolId: true } } },
    });
    if (!scale) throw new NotFoundException("Grade scale not found");
    if (scale.gradeLevel.schoolId !== schoolId) throw new ForbiddenException();
    return this.prisma.gradeScale.delete({ where: { id } });
  }
}
