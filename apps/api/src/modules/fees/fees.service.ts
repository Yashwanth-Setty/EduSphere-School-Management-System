import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from "@nestjs/common";
import { PrismaService } from "../../config/prisma.service";
import { CreateFeePlanDto } from "./dto/create-fee-plan.dto";
import { CreateInvoiceDto } from "./dto/create-invoice.dto";
import { RecordPaymentDto } from "./dto/record-payment.dto";

@Injectable()
export class FeesService {
  constructor(private prisma: PrismaService) {}

  // ── Fee Plans ──────────────────────────────────────────────────────────────

  async listPlans(schoolId: string) {
    return this.prisma.feePlan.findMany({
      where: { schoolId },
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { invoices: true } } },
    });
  }

  async createPlan(dto: CreateFeePlanDto, schoolId: string) {
    return this.prisma.feePlan.create({
      data: {
        schoolId,
        name: dto.name,
        description: dto.description,
        amount: dto.amount,
        currency: dto.currency ?? "USD",
        isActive: dto.isActive ?? true,
      },
    });
  }

  // ── Invoices ───────────────────────────────────────────────────────────────

  async listInvoices(
    schoolId: string,
    opts: { page: number; pageSize: number; studentProfileId?: string; status?: string },
  ) {
    const { page, pageSize, studentProfileId, status } = opts;

    const where: Record<string, unknown> = {
      feePlan: { schoolId },
      ...(studentProfileId && { studentProfileId }),
      ...(status && { status }),
    };

    const [data, total] = await Promise.all([
      this.prisma.feeInvoice.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          feePlan: { select: { name: true, currency: true } },
          studentProfile: { select: { admissionNo: true, firstName: true, lastName: true } },
          _count: { select: { payments: true } },
        },
        orderBy: { issuedAt: "desc" },
      }),
      this.prisma.feeInvoice.count({ where }),
    ]);

    return { data, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
  }

  async listMyInvoices(userId: string, page: number, pageSize: number) {
    const profile = await this.prisma.studentProfile.findUnique({ where: { userId } });
    if (!profile) return { data: [], total: 0, page, pageSize, totalPages: 0 };
    return this.listInvoices(profile.schoolId, { page, pageSize, studentProfileId: profile.id });
  }

  async listLinkedInvoices(userId: string, page: number, pageSize: number) {
    const parent = await this.prisma.parentProfile.findUnique({ where: { userId } });
    if (!parent) return { data: [], total: 0, page, pageSize, totalPages: 0 };

    const links = await this.prisma.parentStudentLink.findMany({
      where: { parentProfileId: parent.id, isActive: true },
      select: { studentProfileId: true },
    });

    const studentIds = links.map((l) => l.studentProfileId);
    if (studentIds.length === 0) return { data: [], total: 0, page, pageSize, totalPages: 0 };

    const [data, total] = await Promise.all([
      this.prisma.feeInvoice.findMany({
        where: { studentProfileId: { in: studentIds } },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          feePlan: { select: { name: true, currency: true } },
          studentProfile: { select: { admissionNo: true, firstName: true, lastName: true } },
          _count: { select: { payments: true } },
        },
        orderBy: { issuedAt: "desc" },
      }),
      this.prisma.feeInvoice.count({ where: { studentProfileId: { in: studentIds } } }),
    ]);

    return { data, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
  }

  async getInvoice(id: string, schoolId: string) {
    const inv = await this.prisma.feeInvoice.findUnique({
      where: { id },
      include: {
        feePlan: true,
        studentProfile: {
          include: {
            user: { select: { email: true } },
            section: { select: { name: true } },
          },
        },
        payments: { orderBy: { createdAt: "asc" } },
      },
    });
    if (!inv) throw new NotFoundException("Invoice not found");
    if (inv.feePlan.schoolId !== schoolId) throw new ForbiddenException();
    return inv;
  }

  async getMyInvoice(id: string, userId: string) {
    const profile = await this.prisma.studentProfile.findUnique({ where: { userId } });
    if (!profile) throw new ForbiddenException();
    const inv = await this.prisma.feeInvoice.findUnique({
      where: { id },
      include: { feePlan: true, payments: { orderBy: { createdAt: "asc" } } },
    });
    if (!inv) throw new NotFoundException("Invoice not found");
    if (inv.studentProfileId !== profile.id) throw new ForbiddenException();
    return inv;
  }

  async getLinkedInvoice(id: string, userId: string) {
    const parent = await this.prisma.parentProfile.findUnique({ where: { userId } });
    if (!parent) throw new ForbiddenException();

    const inv = await this.prisma.feeInvoice.findUnique({
      where: { id },
      include: { feePlan: true, payments: { orderBy: { createdAt: "asc" } } },
    });
    if (!inv) throw new NotFoundException("Invoice not found");

    const link = await this.prisma.parentStudentLink.findFirst({
      where: { parentProfileId: parent.id, studentProfileId: inv.studentProfileId, isActive: true },
    });
    if (!link) throw new ForbiddenException();
    return inv;
  }

  async createInvoice(dto: CreateInvoiceDto, actingUserId: string) {
    const plan = await this.prisma.feePlan.findUnique({ where: { id: dto.feePlanId } });
    if (!plan) throw new NotFoundException("Fee plan not found");
    if (!plan.isActive) throw new BadRequestException("Fee plan is inactive");

    const student = await this.prisma.studentProfile.findUnique({ where: { id: dto.studentProfileId } });
    if (!student) throw new NotFoundException("Student not found");
    if (student.schoolId !== plan.schoolId) throw new ForbiddenException();

    const invoiceNo = `INV-${Date.now()}-${Math.random().toString(36).slice(-4).toUpperCase()}`;

    return this.prisma.$transaction(async (tx) => {
      const inv = await tx.feeInvoice.create({
        data: {
          feePlanId: dto.feePlanId,
          studentProfileId: dto.studentProfileId,
          invoiceNo,
          amountDue: dto.amountDue,
          dueDate: new Date(dto.dueDate),
          status: "pending",
        },
        include: { feePlan: true, studentProfile: true },
      });
      await tx.auditLog.create({
        data: {
          schoolId: plan.schoolId,
          userId: actingUserId,
          action: "fees.invoice.create",
          entityType: "fee_invoice",
          entityId: inv.id,
        },
      });
      return inv;
    });
  }

  // ── Payments ───────────────────────────────────────────────────────────────

  async recordPayment(invoiceId: string, dto: RecordPaymentDto, schoolId: string, actingUserId: string) {
    const inv = await this.prisma.feeInvoice.findUnique({
      where: { id: invoiceId },
      include: { feePlan: true },
    });
    if (!inv) throw new NotFoundException("Invoice not found");
    if (inv.feePlan.schoolId !== schoolId) throw new ForbiddenException();
    if (inv.status === "paid") throw new BadRequestException("Invoice already fully paid");

    const newPaid = inv.amountPaid + dto.amount;
    const newStatus = newPaid >= inv.amountDue ? "paid" : "partial";

    return this.prisma.$transaction(async (tx) => {
      const payment = await tx.payment.create({
        data: {
          feeInvoiceId: invoiceId,
          amount: dto.amount,
          method: dto.method,
          referenceNo: dto.referenceNo,
          gatewayRef: dto.gatewayRef,
          status: "completed",
          paidAt: new Date(),
        },
      });

      await tx.feeInvoice.update({
        where: { id: invoiceId },
        data: { amountPaid: newPaid, status: newStatus },
      });

      await tx.auditLog.create({
        data: {
          schoolId,
          userId: actingUserId,
          action: "fees.payment.record",
          entityType: "payment",
          entityId: payment.id,
          metadata: { invoiceId, amount: dto.amount, method: dto.method },
        },
      });

      return payment;
    });
  }

  // ── Finance Dashboard ──────────────────────────────────────────────────────

  async getDashboard(schoolId: string) {
    const [totalInvoices, paidInvoices, overdueInvoices, recentPayments, planStats] = await Promise.all([
      this.prisma.feeInvoice.count({ where: { feePlan: { schoolId } } }),
      this.prisma.feeInvoice.count({ where: { feePlan: { schoolId }, status: "paid" } }),
      this.prisma.feeInvoice.count({
        where: { feePlan: { schoolId }, status: { in: ["pending", "partial"] }, dueDate: { lt: new Date() } },
      }),
      this.prisma.payment.findMany({
        where: { feeInvoice: { feePlan: { schoolId } }, status: "completed" },
        orderBy: { paidAt: "desc" },
        take: 10,
        include: {
          feeInvoice: {
            include: {
              studentProfile: { select: { firstName: true, lastName: true } },
              feePlan: { select: { name: true, currency: true } },
            },
          },
        },
      }),
      this.prisma.feeInvoice.groupBy({
        by: ["feePlanId"],
        where: { feePlan: { schoolId } },
        _sum: { amountDue: true, amountPaid: true },
        _count: true,
      }),
    ]);

    const totalCollected = await this.prisma.payment.aggregate({
      where: { feeInvoice: { feePlan: { schoolId } }, status: "completed" },
      _sum: { amount: true },
    });

    const totalOutstanding = await this.prisma.feeInvoice.aggregate({
      where: { feePlan: { schoolId }, status: { in: ["pending", "partial"] } },
      _sum: { amountDue: true, amountPaid: true },
    });

    const outstanding =
      (totalOutstanding._sum.amountDue ?? 0) - (totalOutstanding._sum.amountPaid ?? 0);

    return {
      totalInvoices,
      paidInvoices,
      overdueInvoices,
      pendingInvoices: totalInvoices - paidInvoices,
      totalCollected: totalCollected._sum.amount ?? 0,
      totalOutstanding: outstanding,
      recentPayments,
      planStats,
    };
  }
}
