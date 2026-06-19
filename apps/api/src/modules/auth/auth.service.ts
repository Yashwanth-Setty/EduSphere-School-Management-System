import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import * as bcrypt from "bcryptjs";
import * as crypto from "crypto";
import { PrismaService } from "../../config/prisma.service";
import { LoginDto } from "./dto/login.dto";
import { LoginResponse, RefreshResponse } from "../../shared";

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private config: ConfigService,
  ) {}

  async login(dto: LoginDto): Promise<LoginResponse> {
    const school = await this.prisma.school.findUnique({
      where: { code: dto.schoolCode },
    });
    if (!school || !school.isActive) {
      throw new UnauthorizedException("Invalid school code");
    }

    const user = await this.prisma.user.findUnique({
      where: { schoolId_email: { schoolId: school.id, email: dto.email } },
      include: { userRoles: { include: { role: true } } },
    });

    if (!user || !user.isActive || !user.passwordHash) {
      throw new UnauthorizedException("Invalid credentials");
    }

    const isValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isValid) {
      throw new UnauthorizedException("Invalid credentials");
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const roles = user.userRoles.map((ur) => ur.role.name) as any[];
    const accessToken = this.signAccessToken(user.id, user.email, roles, school.id);
    const refreshToken = await this.createRefreshToken(user.id);

    await this.prisma.auditLog.create({
      data: {
        schoolId: school.id,
        userId: user.id,
        action: "auth.login",
        entityType: "user",
        entityId: user.id,
      },
    });

    return {
      accessToken,
      refreshToken,
      expiresIn: Number(this.config.get("JWT_ACCESS_EXPIRES", 900)),
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        roles,
        schoolId: school.id,
      },
    };
  }

  async refresh(rawToken: string): Promise<RefreshResponse> {
    const tokenHash = this.hashToken(rawToken);
    const stored = await this.prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: { user: { include: { userRoles: { include: { role: true } } } } },
    });

    if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
      throw new UnauthorizedException("Invalid or expired refresh token");
    }

    const { user } = stored;
    if (!user.isActive) {
      throw new UnauthorizedException("User inactive");
    }

    const roles = user.userRoles.map((ur) => ur.role.name) as any[];
    const accessToken = this.signAccessToken(user.id, user.email, roles, user.schoolId);

    return {
      accessToken,
      expiresIn: Number(this.config.get("JWT_ACCESS_EXPIRES", 900)),
    };
  }

  async logout(userId: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  private signAccessToken(
    userId: string,
    email: string,
    roles: string[],
    schoolId: string,
  ): string {
    return this.jwt.sign(
      { sub: userId, email, roles, schoolId },
      { expiresIn: Number(this.config.get("JWT_ACCESS_EXPIRES", 900)) },
    );
  }

  private async createRefreshToken(userId: string): Promise<string> {
    const raw = crypto.randomBytes(64).toString("hex");
    const tokenHash = this.hashToken(raw);
    const expiresAt = new Date(
      Date.now() + Number(this.config.get("JWT_REFRESH_EXPIRES", 604800)) * 1000,
    );

    await this.prisma.refreshToken.create({
      data: { userId, tokenHash, expiresAt },
    });

    return raw;
  }

  private hashToken(token: string): string {
    return crypto.createHash("sha256").update(token).digest("hex");
  }
}
