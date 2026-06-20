import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../config/prisma.service";

@Injectable()
export class TransportService {
  constructor(private prisma: PrismaService) {}

  async findAll(schoolId: string) {
    return this.prisma.transportRoute.findMany({
      where: { schoolId, isActive: true },
      include: {
        _count: { select: { assignments: { where: { isActive: true } } } },
      },
      orderBy: { routeName: "asc" },
    });
  }

  async findOne(id: string, schoolId: string) {
    const route = await this.prisma.transportRoute.findFirst({
      where: { id, schoolId },
      include: {
        assignments: {
          where: { isActive: true },
          include: {
            studentProfile: { select: { firstName: true, lastName: true, admissionNo: true } },
          },
        },
      },
    });
    if (!route) throw new NotFoundException("Transport route not found");
    return route;
  }

  async findMyRoute(schoolId: string, userId: string) {
    // Try direct student lookup first
    let student = await this.prisma.studentProfile.findFirst({ where: { userId, schoolId } });

    // If parent, get their first linked child
    if (!student) {
      const parent = await this.prisma.parentProfile.findFirst({ where: { userId } });
      if (parent) {
        const link = await this.prisma.parentStudentLink.findFirst({
          where: { parentProfileId: parent.id, isActive: true },
        });
        if (link) {
          student = await this.prisma.studentProfile.findUnique({ where: { id: link.studentProfileId } });
        }
      }
    }

    if (!student) return null;
    return this.prisma.transportAssignment.findFirst({
      where: { studentProfileId: student.id, isActive: true },
      include: { route: true },
    });
  }

  async create(schoolId: string, dto: {
    routeName: string;
    vehicleNumber: string;
    driverName: string;
    driverPhone?: string;
    capacity?: number;
    status?: string;
  }) {
    return this.prisma.transportRoute.create({
      data: { schoolId, ...dto },
    });
  }

  async update(id: string, schoolId: string, dto: Partial<{
    routeName: string;
    vehicleNumber: string;
    driverName: string;
    driverPhone: string;
    capacity: number;
    status: string;
  }>) {
    await this.findOne(id, schoolId);
    return this.prisma.transportRoute.update({ where: { id }, data: dto });
  }
}
