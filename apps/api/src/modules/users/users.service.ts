import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../config/prisma.service";

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findById(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        displayName: true,
        avatarUrl: true,
        schoolId: true,
        isActive: true,
        lastLoginAt: true,
        userRoles: { include: { role: true } },
      },
    });
  }
}
