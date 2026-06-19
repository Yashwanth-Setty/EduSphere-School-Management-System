import { Injectable, NotFoundException, ForbiddenException } from "@nestjs/common";
import { PrismaService } from "../../config/prisma.service";
import { CreateDocumentDto } from "./dto/create-document.dto";
import { Role } from "../../shared";

// Maps role → the visibilityScopes that role may read
const ROLE_SCOPES: Partial<Record<Role, string[]>> = {
  [Role.ADMIN]:      ["school_admin", "section", "student", "finance", "counselor"],
  [Role.PRINCIPAL]:  ["school_admin", "section", "student"],
  [Role.TEACHER]:    ["school_admin", "section", "student"],
  [Role.STUDENT]:    ["school_admin", "student"],
  [Role.PARENT]:     ["school_admin", "student"],
  [Role.ACCOUNTANT]: ["school_admin", "finance"],
  [Role.COUNSELOR]:  ["school_admin", "counselor"],
};

@Injectable()
export class DocumentsService {
  constructor(private prisma: PrismaService) {}

  private allowedScopes(roles: string[]): string[] {
    const scopes = new Set<string>();
    for (const role of roles) {
      for (const s of ROLE_SCOPES[role as Role] ?? []) scopes.add(s);
    }
    return [...scopes];
  }

  async findAll(
    schoolId: string,
    roles: string[],
    opts: { page: number; pageSize: number; category?: string; search?: string },
  ) {
    const { page, pageSize, category, search } = opts;
    const scopes = this.allowedScopes(roles);

    const where = {
      schoolId,
      isDeleted: false,
      visibilityScope: { in: scopes },
      ...(category && { category }),
      ...(search && { title: { contains: search, mode: "insensitive" as const } }),
    };

    const [data, total] = await Promise.all([
      this.prisma.document.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: "desc" },
        include: { school: { select: { name: true } } },
      }),
      this.prisma.document.count({ where }),
    ]);

    return { data, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
  }

  async findOne(id: string, schoolId: string, roles: string[]) {
    const doc = await this.prisma.document.findUnique({ where: { id } });
    if (!doc || doc.isDeleted) throw new NotFoundException("Document not found");
    if (doc.schoolId !== schoolId) throw new ForbiddenException();
    const allowed = this.allowedScopes(roles);
    if (!allowed.includes(doc.visibilityScope)) throw new ForbiddenException("Insufficient access to this document");
    return doc;
  }

  async create(dto: CreateDocumentDto, schoolId: string, uploadedById: string) {
    return this.prisma.document.create({
      data: {
        schoolId,
        uploadedById,
        category: dto.category,
        title: dto.title,
        storageKey: dto.storageKey,
        mimeType: dto.mimeType,
        sizeBytes: dto.sizeBytes,
        visibilityScope: dto.visibilityScope ?? "school_admin",
        tags: dto.tags ?? [],
        retentionLabel: dto.retentionLabel,
      },
    });
  }

  async softDelete(id: string, schoolId: string) {
    const doc = await this.prisma.document.findUnique({ where: { id } });
    if (!doc) throw new NotFoundException("Document not found");
    if (doc.schoolId !== schoolId) throw new ForbiddenException();
    return this.prisma.document.update({ where: { id }, data: { isDeleted: true } });
  }
}
