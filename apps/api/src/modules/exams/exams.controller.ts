import {
  Controller, Get, Post, Patch, Param, Body, Query,
  UseGuards, ParseIntPipe, DefaultValuePipe,
} from "@nestjs/common";
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from "@nestjs/swagger";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { Role } from "../../shared";
import { ExamsService } from "./exams.service";
import { CreateExamDto } from "./dto/create-exam.dto";
import { UpdateExamDto } from "./dto/update-exam.dto";
import { EnterResultsDto } from "./dto/enter-results.dto";

interface JwtUser { id: string; schoolId: string; roles: Role[] }

@ApiTags("exams")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller("exams")
export class ExamsController {
  constructor(private service: ExamsService) {}

  @Get()
  @Roles(Role.ADMIN, Role.PRINCIPAL, Role.TEACHER, Role.STUDENT, Role.PARENT)
  @ApiOperation({ summary: "List exams" })
  @ApiQuery({ name: "courseOfferingId", required: false })
  @ApiQuery({ name: "page", required: false })
  @ApiQuery({ name: "pageSize", required: false })
  findAll(
    @CurrentUser() user: JwtUser,
    @Query("courseOfferingId") courseOfferingId?: string,
    @Query("page", new DefaultValuePipe(1), ParseIntPipe) page = 1,
    @Query("pageSize", new DefaultValuePipe(20), ParseIntPipe) pageSize = 20,
  ) {
    return this.service.findAll(user.schoolId, courseOfferingId, page, pageSize);
  }

  @Get(":id")
  @Roles(Role.ADMIN, Role.PRINCIPAL, Role.TEACHER, Role.STUDENT, Role.PARENT)
  @ApiOperation({ summary: "Get exam detail" })
  findOne(@Param("id") id: string, @CurrentUser() user: JwtUser) {
    return this.service.findOne(id, user.schoolId);
  }

  @Post()
  @Roles(Role.ADMIN, Role.PRINCIPAL, Role.TEACHER)
  @ApiOperation({ summary: "Create exam" })
  create(@Body() dto: CreateExamDto, @CurrentUser() user: JwtUser) {
    return this.service.create(dto, user.schoolId);
  }

  @Patch(":id")
  @Roles(Role.ADMIN, Role.PRINCIPAL, Role.TEACHER)
  @ApiOperation({ summary: "Update exam" })
  update(@Param("id") id: string, @Body() dto: UpdateExamDto, @CurrentUser() user: JwtUser) {
    return this.service.update(id, dto, user.schoolId);
  }

  @Get(":id/results")
  @Roles(Role.ADMIN, Role.PRINCIPAL, Role.TEACHER)
  @ApiOperation({ summary: "Get all results for an exam (teacher/admin)" })
  getResults(@Param("id") id: string, @CurrentUser() user: JwtUser) {
    return this.service.getResults(id, user.schoolId);
  }

  @Get(":id/my-result")
  @Roles(Role.STUDENT, Role.PARENT)
  @ApiOperation({ summary: "Get my result for this exam (student/parent)" })
  getMyResult(@Param("id") id: string, @CurrentUser() user: JwtUser) {
    return this.service.getMyResult(id, user.id);
  }

  @Post(":id/results")
  @Roles(Role.ADMIN, Role.PRINCIPAL, Role.TEACHER)
  @ApiOperation({ summary: "Bulk upsert results for an exam" })
  upsertResults(
    @Param("id") id: string,
    @Body() dto: EnterResultsDto,
    @CurrentUser() user: JwtUser,
  ) {
    return this.service.upsertResults(id, dto, user.schoolId);
  }
}
