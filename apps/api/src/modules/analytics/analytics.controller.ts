import {
  Controller, Get, Query, UseGuards, Res, Header,
} from "@nestjs/common";
import { Response } from "express";
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from "@nestjs/swagger";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { Role } from "../../shared";
import { AnalyticsService } from "./analytics.service";

@ApiTags("analytics")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller("analytics")
export class AnalyticsController {
  constructor(private analytics: AnalyticsService) {}

  @Get("overview")
  @Roles(Role.ADMIN, Role.PRINCIPAL, Role.ACCOUNTANT)
  @ApiOperation({ summary: "Admin dashboard KPI overview" })
  getOverview(@CurrentUser() user: { schoolId: string }) {
    return this.analytics.getOverview(user.schoolId);
  }

  @Get("attendance")
  @Roles(Role.ADMIN, Role.PRINCIPAL, Role.TEACHER)
  @ApiOperation({ summary: "Attendance report with session-level breakdown" })
  @ApiQuery({ name: "sectionId", required: false })
  @ApiQuery({ name: "from", required: false, description: "ISO date YYYY-MM-DD" })
  @ApiQuery({ name: "to", required: false, description: "ISO date YYYY-MM-DD" })
  getAttendanceReport(
    @CurrentUser() user: { schoolId: string },
    @Query("sectionId") sectionId?: string,
    @Query("from") from?: string,
    @Query("to") to?: string,
  ) {
    return this.analytics.getAttendanceReport(user.schoolId, { sectionId, from, to });
  }

  @Get("academic")
  @Roles(Role.ADMIN, Role.PRINCIPAL, Role.TEACHER)
  @ApiOperation({ summary: "Academic performance report — exam averages by course" })
  @ApiQuery({ name: "sectionId", required: false })
  @ApiQuery({ name: "term", required: false })
  getAcademicReport(
    @CurrentUser() user: { schoolId: string },
    @Query("sectionId") sectionId?: string,
    @Query("term") term?: string,
  ) {
    return this.analytics.getAcademicReport(user.schoolId, { sectionId, term });
  }

  @Get("finance")
  @Roles(Role.ADMIN, Role.PRINCIPAL, Role.ACCOUNTANT)
  @ApiOperation({ summary: "Finance report — monthly collection summary" })
  @ApiQuery({ name: "from", required: false })
  @ApiQuery({ name: "to", required: false })
  getFinanceReport(
    @CurrentUser() user: { schoolId: string },
    @Query("from") from?: string,
    @Query("to") to?: string,
  ) {
    return this.analytics.getFinanceReport(user.schoolId, { from, to });
  }

  // ── CSV exports ────────────────────────────────────────────────────────────

  @Get("attendance/export")
  @Roles(Role.ADMIN, Role.PRINCIPAL, Role.TEACHER)
  @ApiOperation({ summary: "Export attendance report as CSV" })
  @Header("Content-Type", "text/csv")
  @Header("Content-Disposition", "attachment; filename=attendance-report.csv")
  async exportAttendance(
    @CurrentUser() user: { schoolId: string },
    @Query("sectionId") sectionId?: string,
    @Query("from") from?: string,
    @Query("to") to?: string,
    @Res() res?: Response,
  ) {
    const csv = await this.analytics.exportAttendanceCsv(user.schoolId, { sectionId, from, to });
    res!.send(csv);
  }

  @Get("academic/export")
  @Roles(Role.ADMIN, Role.PRINCIPAL, Role.TEACHER)
  @ApiOperation({ summary: "Export academic performance report as CSV" })
  @Header("Content-Type", "text/csv")
  @Header("Content-Disposition", "attachment; filename=academic-report.csv")
  async exportAcademic(
    @CurrentUser() user: { schoolId: string },
    @Query("sectionId") sectionId?: string,
    @Query("term") term?: string,
    @Res() res?: Response,
  ) {
    const csv = await this.analytics.exportAcademicCsv(user.schoolId, { sectionId, term });
    res!.send(csv);
  }

  @Get("finance/export")
  @Roles(Role.ADMIN, Role.PRINCIPAL, Role.ACCOUNTANT)
  @ApiOperation({ summary: "Export finance report as CSV" })
  @Header("Content-Type", "text/csv")
  @Header("Content-Disposition", "attachment; filename=finance-report.csv")
  async exportFinance(
    @CurrentUser() user: { schoolId: string },
    @Query("from") from?: string,
    @Query("to") to?: string,
    @Res() res?: Response,
  ) {
    const csv = await this.analytics.exportFinanceCsv(user.schoolId, { from, to });
    res!.send(csv);
  }
}
