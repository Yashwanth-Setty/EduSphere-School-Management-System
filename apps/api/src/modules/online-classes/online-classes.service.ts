import { Injectable, NotFoundException, ForbiddenException } from "@nestjs/common";
import { PrismaService } from "../../config/prisma.service";

@Injectable()
export class OnlineClassesService {
  constructor(private prisma: PrismaService) {}

  private readonly include = {
    courseOffering: {
      include: {
        course: { select: { code: true, name: true } },
        section: { select: { name: true } },
      },
    },
    host: { select: { firstName: true, lastName: true } },
  };

  async findAll(schoolId: string, page = 1, pageSize = 20) {
    const skip = (page - 1) * pageSize;
    const [data, total] = await Promise.all([
      this.prisma.onlineClass.findMany({
        where: { schoolId },
        include: this.include,
        orderBy: { scheduledAt: "desc" },
        skip,
        take: pageSize,
      }),
      this.prisma.onlineClass.count({ where: { schoolId } }),
    ]);
    return { data, total };
  }

  async findOne(id: string, schoolId: string) {
    const oc = await this.prisma.onlineClass.findFirst({
      where: { id, schoolId },
      include: this.include,
    });
    if (!oc) throw new NotFoundException("Online class not found");
    return oc;
  }

  async create(
    schoolId: string,
    userId: string,
    dto: {
      courseOfferingId: string;
      title: string;
      scheduledAt: string;
      durationMins?: number;
      meetingLink: string;
      status?: string;
    },
  ) {
    const staff = await this.prisma.staffProfile.findFirst({ where: { userId, schoolId } });
    if (!staff) throw new ForbiddenException("Only staff can create online classes");
    return this.prisma.onlineClass.create({
      data: { schoolId, hostId: staff.id, ...dto, scheduledAt: new Date(dto.scheduledAt) },
      include: this.include,
    });
  }

  async update(id: string, schoolId: string, userId: string, roles: string[], dto: Partial<{
    title: string;
    scheduledAt: string;
    durationMins: number;
    meetingLink: string;
    status: string;
  }>) {
    const oc = await this.findOne(id, schoolId);
    // Teachers can only update their own classes
    if (!roles.includes("admin") && !roles.includes("principal")) {
      const staff = await this.prisma.staffProfile.findFirst({ where: { userId, schoolId } });
      if (!staff || oc.hostId !== staff.id) throw new ForbiddenException("Cannot edit another teacher's class");
    }
    return this.prisma.onlineClass.update({
      where: { id },
      data: { ...dto, ...(dto.scheduledAt ? { scheduledAt: new Date(dto.scheduledAt) } : {}) },
      include: this.include,
    });
  }
}
