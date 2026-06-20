import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  UseGuards,
  ParseIntPipe,
  DefaultValuePipe,
} from "@nestjs/common";
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from "@nestjs/swagger";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { Role } from "../../shared";
import { FeesService } from "./fees.service";
import { CreateFeePlanDto } from "./dto/create-fee-plan.dto";
import { CreateInvoiceDto } from "./dto/create-invoice.dto";
import { RecordPaymentDto } from "./dto/record-payment.dto";

@ApiTags("fees")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller("fees")
export class FeesController {
  constructor(private fees: FeesService) {}

  // ── Finance Dashboard ──────────────────────────────────────────────────────

  @Get("dashboard")
  @Roles(Role.ADMIN, Role.ACCOUNTANT)
  @ApiOperation({ summary: "Finance summary dashboard" })
  getDashboard(@CurrentUser() user: { schoolId: string }) {
    return this.fees.getDashboard(user.schoolId);
  }

  // ── Fee Plans ──────────────────────────────────────────────────────────────

  @Get("plans")
  @Roles(Role.ADMIN, Role.ACCOUNTANT)
  @ApiOperation({ summary: "List fee plans" })
  listPlans(@CurrentUser() user: { schoolId: string }) {
    return this.fees.listPlans(user.schoolId);
  }

  @Post("plans")
  @Roles(Role.ADMIN, Role.ACCOUNTANT)
  @ApiOperation({ summary: "Create a fee plan" })
  createPlan(@Body() dto: CreateFeePlanDto, @CurrentUser() user: { schoolId: string }) {
    return this.fees.createPlan(dto, user.schoolId);
  }

  // ── Student/Parent invoice shortcut ───────────────────────────────────────

  @Get("my-invoices")
  @Roles(Role.STUDENT, Role.PARENT)
  @ApiOperation({ summary: "List invoices for the current student or parent's children" })
  @ApiQuery({ name: "page", required: false })
  @ApiQuery({ name: "pageSize", required: false })
  getMyInvoices(
    @CurrentUser() user: { id: string; roles: string[] },
    @Query("page", new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query("pageSize", new DefaultValuePipe(20), ParseIntPipe) pageSize: number,
  ) {
    if (user.roles.includes(Role.PARENT)) {
      return this.fees.listLinkedInvoices(user.id, page, pageSize);
    }
    return this.fees.listMyInvoices(user.id, page, pageSize);
  }

  // ── Invoices — admin/accountant ────────────────────────────────────────────

  @Get("invoices")
  @Roles(Role.ADMIN, Role.ACCOUNTANT, Role.STUDENT, Role.PARENT)
  @ApiOperation({ summary: "List invoices (scoped by role)" })
  @ApiQuery({ name: "page", required: false })
  @ApiQuery({ name: "pageSize", required: false })
  @ApiQuery({ name: "status", required: false })
  @ApiQuery({ name: "studentProfileId", required: false })
  listInvoices(
    @CurrentUser() user: { id: string; schoolId: string; roles: string[] },
    @Query("page", new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query("pageSize", new DefaultValuePipe(20), ParseIntPipe) pageSize: number,
    @Query("status") status?: string,
    @Query("studentProfileId") studentProfileId?: string,
  ) {
    if (user.roles.includes(Role.STUDENT)) {
      return this.fees.listMyInvoices(user.id, page, pageSize);
    }
    if (user.roles.includes(Role.PARENT)) {
      return this.fees.listLinkedInvoices(user.id, page, pageSize);
    }
    return this.fees.listInvoices(user.schoolId, { page, pageSize, studentProfileId, status });
  }

  @Post("invoices")
  @Roles(Role.ADMIN, Role.ACCOUNTANT)
  @ApiOperation({ summary: "Generate a fee invoice" })
  createInvoice(
    @Body() dto: CreateInvoiceDto,
    @CurrentUser() user: { id: string },
  ) {
    return this.fees.createInvoice(dto, user.id);
  }

  @Get("invoices/:id")
  @Roles(Role.ADMIN, Role.ACCOUNTANT, Role.STUDENT, Role.PARENT)
  @ApiOperation({ summary: "Get invoice detail (scoped by role)" })
  getInvoice(
    @Param("id") id: string,
    @CurrentUser() user: { id: string; schoolId: string; roles: string[] },
  ) {
    if (user.roles.includes(Role.STUDENT)) {
      return this.fees.getMyInvoice(id, user.id);
    }
    if (user.roles.includes(Role.PARENT)) {
      return this.fees.getLinkedInvoice(id, user.id);
    }
    return this.fees.getInvoice(id, user.schoolId);
  }

  // ── Payments ───────────────────────────────────────────────────────────────

  @Post("invoices/:id/payments")
  @Roles(Role.ADMIN, Role.ACCOUNTANT)
  @ApiOperation({ summary: "Record a payment against an invoice" })
  recordPayment(
    @Param("id") id: string,
    @Body() dto: RecordPaymentDto,
    @CurrentUser() user: { id: string; schoolId: string },
  ) {
    return this.fees.recordPayment(id, dto, user.schoolId, user.id);
  }

  // ── Receipt ────────────────────────────────────────────────────────────────

  @Get("invoices/:id/receipt")
  @Roles(Role.ADMIN, Role.ACCOUNTANT, Role.STUDENT, Role.PARENT)
  @ApiOperation({ summary: "Get receipt (invoice + all payments)" })
  getReceipt(
    @Param("id") id: string,
    @CurrentUser() user: { id: string; schoolId: string; roles: string[] },
  ) {
    if (user.roles.includes(Role.STUDENT)) {
      return this.fees.getMyInvoice(id, user.id);
    }
    if (user.roles.includes(Role.PARENT)) {
      return this.fees.getLinkedInvoice(id, user.id);
    }
    return this.fees.getInvoice(id, user.schoolId);
  }
}
