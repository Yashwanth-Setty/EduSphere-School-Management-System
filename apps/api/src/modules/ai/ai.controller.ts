import {
  Controller, Get, Post, Param, Query, UseGuards, ParseIntPipe, DefaultValuePipe,
} from "@nestjs/common";
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from "@nestjs/swagger";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { Role } from "../../shared";
import { AiService } from "./ai.service";

@ApiTags("ai")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller("ai")
export class AiController {
  constructor(private ai: AiService) {}

  // ── Run jobs ───────────────────────────────────────────────────────────────

  @Post("run/attendance-risk")
  @Roles(Role.ADMIN, Role.PRINCIPAL)
  @ApiOperation({ summary: "Score attendance risk for all active students (last 30 days)" })
  runAttendanceRisk(@CurrentUser() user: { id: string; schoolId: string }) {
    return this.ai.runAttendanceRisk(user.schoolId, user.id);
  }

  @Post("run/performance-summary")
  @Roles(Role.ADMIN, Role.PRINCIPAL)
  @ApiOperation({ summary: "Generate performance summaries from published exam results" })
  runPerformanceSummary(@CurrentUser() user: { id: string; schoolId: string }) {
    return this.ai.runPerformanceSummary(user.schoolId, user.id);
  }

  // ── Recommendations ────────────────────────────────────────────────────────

  @Get("recommendations")
  @Roles(Role.ADMIN, Role.PRINCIPAL, Role.COUNSELOR)
  @ApiOperation({ summary: "List all AI recommendations for the school" })
  @ApiQuery({ name: "type", required: false, description: "attendance_risk | performance_summary" })
  @ApiQuery({ name: "page", required: false })
  @ApiQuery({ name: "pageSize", required: false })
  listRecommendations(
    @CurrentUser() user: { schoolId: string },
    @Query("type") type?: string,
    @Query("page", new DefaultValuePipe(1), ParseIntPipe) page?: number,
    @Query("pageSize", new DefaultValuePipe(20), ParseIntPipe) pageSize?: number,
  ) {
    return this.ai.listRecommendations(user.schoolId, { type, page: page!, pageSize: pageSize! });
  }

  @Get("recommendations/student/:studentProfileId")
  @Roles(Role.ADMIN, Role.PRINCIPAL, Role.COUNSELOR, Role.TEACHER)
  @ApiOperation({ summary: "Get all AI insights for a specific student" })
  getStudentInsights(@Param("studentProfileId") studentProfileId: string) {
    return this.ai.getStudentInsights(studentProfileId);
  }

  // ── Audit logs ─────────────────────────────────────────────────────────────

  @Get("audit-logs")
  @Roles(Role.ADMIN, Role.PRINCIPAL)
  @ApiOperation({ summary: "AI-specific audit log entries for the school" })
  @ApiQuery({ name: "page", required: false })
  @ApiQuery({ name: "pageSize", required: false })
  getAuditLogs(
    @CurrentUser() user: { schoolId: string },
    @Query("page", new DefaultValuePipe(1), ParseIntPipe) page?: number,
    @Query("pageSize", new DefaultValuePipe(20), ParseIntPipe) pageSize?: number,
  ) {
    return this.ai.getAiAuditLogs(user.schoolId, { page: page!, pageSize: pageSize! });
  }
}
