import { Injectable, NotFoundException, ForbiddenException } from "@nestjs/common";
import { PrismaService } from "../../config/prisma.service";
import { CreateAnnouncementDto } from "./dto/create-announcement.dto";
import { UpdateAnnouncementDto } from "./dto/update-announcement.dto";
import { Role } from "../../shared";

// Which audienceScopes a role can read
const AUDIENCE_FOR_ROLE: Partial<Record<Role, string[]>> = {
  [Role.ADMIN]:      ["school", "teachers", "students", "parents", "section"],
  [Role.PRINCIPAL]:  ["school", "teachers", "students", "parents", "section"],
  [Role.TEACHER]:    ["school", "teachers"],
  [Role.STUDENT]:    ["school", "students"],
  [Role.PARENT]:     ["school", "parents"],
  [Role.ACCOUNTANT]: ["school"],
  [Role.COUNSELOR]:  ["school", "teachers"],
};

@Injectable()
export class AnnouncementsService {
  constructor(private prisma: PrismaService) {}

  private audienceScopes(roles: string[]): string[] {
    const scopes = new Set<string>();
    for (const role of roles) {
      for (const s of AUDIENCE_FOR_ROLE[role as Role] ?? []) scopes.add(s);
    }
    return [...scopes];
  }

  async findAll(
    schoolId: string,
    roles: string[],
    opts: { page: number; pageSize: number; includeUnpublished?: boolean },
  ) {
    const { page, pageSize, includeUnpublished } = opts;
    const scopes = this.audienceScopes(roles);
    const canSeeUnpublished = roles.some((r) =>
      [Role.ADMIN, Role.PRINCIPAL, Role.TEACHER].includes(r as Role),
    );

    const now = new Date();
    const where = {
      schoolId,
      audienceScope: { in: scopes },
      ...((!includeUnpublished || !canSeeUnpublished) && { isPublished: true }),
      OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
    };

    const [data, total] = await Promise.all([
      this.prisma.announcement.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: [{ isPublished: "desc" }, { publishedAt: "desc" }, { createdAt: "desc" }],
      }),
      this.prisma.announcement.count({ where }),
    ]);

    return { data, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
  }

  async findOne(id: string, schoolId: string, roles: string[]) {
    const ann = await this.prisma.announcement.findUnique({ where: { id } });
    if (!ann) throw new NotFoundException("Announcement not found");
    if (ann.schoolId !== schoolId) throw new ForbiddenException();

    const canSeeUnpublished = roles.some((r) =>
      [Role.ADMIN, Role.PRINCIPAL, Role.TEACHER].includes(r as Role),
    );
    if (!ann.isPublished && !canSeeUnpublished) throw new ForbiddenException("Announcement not published");

    const scopes = this.audienceScopes(roles);
    if (!scopes.includes(ann.audienceScope)) throw new ForbiddenException("Not in audience");

    return ann;
  }

  async create(dto: CreateAnnouncementDto, schoolId: string, authorId: string) {
    const isPublished = dto.isPublished ?? false;
    return this.prisma.announcement.create({
      data: {
        schoolId,
        authorId,
        title: dto.title,
        body: dto.body,
        audienceScope: dto.audienceScope ?? "school",
        channel: dto.channel ?? "in_app",
        isPublished,
        publishedAt: isPublished ? new Date() : undefined,
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : undefined,
      },
    });
  }

  async update(id: string, dto: UpdateAnnouncementDto, schoolId: string, _roles: string[]) {
    const ann = await this.prisma.announcement.findUnique({ where: { id } });
    if (!ann) throw new NotFoundException("Announcement not found");
    if (ann.schoolId !== schoolId) throw new ForbiddenException();

    const wasPublished = ann.isPublished;
    const nowPublishing = dto.isPublished === true && !wasPublished;

    return this.prisma.announcement.update({
      where: { id },
      data: {
        ...(dto.title !== undefined && { title: dto.title }),
        ...(dto.body !== undefined && { body: dto.body }),
        ...(dto.audienceScope !== undefined && { audienceScope: dto.audienceScope }),
        ...(dto.channel !== undefined && { channel: dto.channel }),
        ...(dto.isPublished !== undefined && { isPublished: dto.isPublished }),
        ...(nowPublishing && { publishedAt: new Date() }),
        ...(dto.expiresAt !== undefined && {
          expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
        }),
      },
    });
  }

  // Notifications feed: recent published announcements for the caller's roles
  async getNotificationFeed(schoolId: string, roles: string[], limit = 10) {
    const scopes = this.audienceScopes(roles);
    const now = new Date();
    return this.prisma.announcement.findMany({
      where: {
        schoolId,
        isPublished: true,
        audienceScope: { in: scopes },
        OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
      },
      orderBy: { publishedAt: "desc" },
      take: limit,
      select: { id: true, title: true, audienceScope: true, publishedAt: true, channel: true },
    });
  }
}
