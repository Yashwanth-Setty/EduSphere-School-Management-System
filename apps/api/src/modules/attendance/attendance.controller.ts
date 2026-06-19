import {
  Controller, Get, Post, Param, Body, Query, UseGuards, ParseIntPipe, DefaultValuePipe,
} from "@nestjs/common";
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from "@nestjs/swagger";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { Role } from "../../shared";
import { AttendanceService } from "./attendance.service";
import { OpenSessionDto } from "./dto/open-session.dto";
import { BulkSubmitDto } from "./dto/bulk-submit.dto";

@ApiTags("attendance")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller("attendance")
export class AttendanceController {
  constructor(private attendance: AttendanceService) {}

  @Get("sessions")
  @Roles(Role.ADMIN, Role.PRINCIPAL, Role.TEACHER)
  @ApiOperation({ summary: "List attendance sessions" })
  @ApiQuery({ name: "sectionId", required: false })
  @ApiQuery({ name: "date", required: false })
  @ApiQuery({ name: "page", required: false })
  @ApiQuery({ name: "pageSize", required: false })
  listSessions(
    @CurrentUser() user: { schoolId: string },
    @Query("sectionId") sectionId?: string,
    @Query("date") date?: string,
    @Query("page", new DefaultValuePipe(1), ParseIntPipe) page?: number,
    @Query("pageSize", new DefaultValuePipe(20), ParseIntPipe) pageSize?: number,
  ) {
    return this.attendance.listSessions(user.schoolId, sectionId, date, page, pageSize);
  }

  @Get("sessions/:id/roster")
  @Roles(Role.ADMIN, Role.PRINCIPAL, Role.TEACHER)
  @ApiOperation({ summary: "Get session roster with student statuses" })
  getRoster(@Param("id") id: string, @CurrentUser() user: { schoolId: string }) {
    return this.attendance.getRoster(id, user.schoolId);
  }

  @Post("sessions")
  @Roles(Role.ADMIN, Role.PRINCIPAL, Role.TEACHER)
  @ApiOperation({ summary: "Open an attendance session" })
  openSession(@Body() dto: OpenSessionDto, @CurrentUser() user: { id: string; schoolId: string }) {
    return this.attendance.openSession(
      dto.sectionId,
      user.id,
      new Date(dto.sessionDate),
      dto.periodNumber,
      user.schoolId,
    );
  }

  @Post("sessions/:id/submit")
  @Roles(Role.ADMIN, Role.PRINCIPAL, Role.TEACHER)
  @ApiOperation({ summary: "Bulk submit attendance records and close session" })
  bulkSubmit(
    @Param("id") id: string,
    @Body() dto: BulkSubmitDto,
    @CurrentUser() user: { id: string },
  ) {
    return this.attendance.bulkSubmit(
      id,
      dto.records.map((r) => ({ studentId: r.studentId, status: r.status, remark: r.remark })),
      user.id,
    );
  }
}
