import { Injectable, NotFoundException, ForbiddenException } from "@nestjs/common";
import { PrismaService } from "../../config/prisma.service";

@Injectable()
export class StaffService {
  constructor(private prisma: PrismaService) {}

  async findAll(schoolId: string, page = 1, pageSize = 20, search?: string) {
    const where = {
      schoolId,
      ...(search && {
        OR: [
          { firstName: { contains: search, mode: "insensitive" as const } },
          { lastName: { contains: search, mode: "insensitive" as const } },
          { employeeNo: { contains: search, mode: "insensitive" as const } },
        ],
      }),
    };

    const [data, total] = await Promise.all([
      this.prisma.staffProfile.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: { user: { select: { email: true } } },
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.staffProfile.count({ where }),
    ]);

    return { data, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
  }

  async findOne(id: string, actingSchoolId: string) {
    const staff = await this.prisma.staffProfile.findUnique({
      where: { id },
      include: { user: { select: { email: true, isActive: true } } },
    });
    if (!staff) throw new NotFoundException("Staff not found");
    if (staff.schoolId !== actingSchoolId) throw new ForbiddenException();
    return staff;
  }
}
