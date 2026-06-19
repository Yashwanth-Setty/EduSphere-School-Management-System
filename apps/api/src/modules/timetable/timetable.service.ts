import { Injectable, ConflictException, NotFoundException, ForbiddenException } from "@nestjs/common";
import { PrismaService } from "../../config/prisma.service";
import { CreateSlotDto } from "./dto/create-slot.dto";
import { UpdateSlotDto } from "./dto/update-slot.dto";

@Injectable()
export class TimetableService {
  constructor(private prisma: PrismaService) {}

  async listSections(schoolId: string) {
    return this.prisma.section.findMany({
      where: { schoolId },
      include: { gradeLevel: true, academicYear: true },
      orderBy: [{ gradeLevel: { displayOrder: "asc" } }, { name: "asc" }],
    });
  }

  async findBySection(sectionId: string, term: string, schoolId: string) {
    const section = await this.prisma.section.findUnique({ where: { id: sectionId } });
    if (!section || section.schoolId !== schoolId) throw new ForbiddenException();

    return this.prisma.timetableSlot.findMany({
      where: { sectionId, term },
      include: {
        section: true,
      },
      orderBy: [{ dayOfWeek: "asc" }, { periodNumber: "asc" }],
    });
  }

  async createSlot(dto: CreateSlotDto, schoolId: string) {
    const section = await this.prisma.section.findUnique({ where: { id: dto.sectionId } });
    if (!section || section.schoolId !== schoolId) throw new ForbiddenException();

    const existing = await this.prisma.timetableSlot.findUnique({
      where: { sectionId_dayOfWeek_periodNumber_term: {
        sectionId: dto.sectionId, dayOfWeek: dto.dayOfWeek, periodNumber: dto.periodNumber, term: dto.term,
      }},
    });
    if (existing) throw new ConflictException("Slot already exists for this day/period/term");

    return this.prisma.timetableSlot.create({ data: dto });
  }

  async updateSlot(id: string, dto: UpdateSlotDto, schoolId: string) {
    const slot = await this.prisma.timetableSlot.findUnique({ where: { id }, include: { section: true } });
    if (!slot) throw new NotFoundException("Slot not found");
    if (slot.section.schoolId !== schoolId) throw new ForbiddenException();

    return this.prisma.timetableSlot.update({ where: { id }, data: dto });
  }

  async deleteSlot(id: string, schoolId: string) {
    const slot = await this.prisma.timetableSlot.findUnique({ where: { id }, include: { section: true } });
    if (!slot) throw new NotFoundException("Slot not found");
    if (slot.section.schoolId !== schoolId) throw new ForbiddenException();

    await this.prisma.timetableSlot.delete({ where: { id } });
  }
}
