import { Controller, Get, Post, Param, Body, Query, UseGuards, ParseIntPipe, DefaultValuePipe } from "@nestjs/common";
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from "@nestjs/swagger";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { Role } from "../../shared";
import { StudentsService } from "./students.service";
import { CreateStudentDto } from "./dto/create-student.dto";

@ApiTags("students")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller("students")
export class StudentsController {
  constructor(private students: StudentsService) {}

  @Get()
  @Roles(Role.ADMIN, Role.PRINCIPAL, Role.TEACHER)
  @ApiOperation({ summary: "List/search students" })
  @ApiQuery({ name: "page", required: false })
  @ApiQuery({ name: "pageSize", required: false })
  @ApiQuery({ name: "search", required: false })
  findAll(
    @CurrentUser() user: { schoolId: string },
    @Query("page", new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query("pageSize", new DefaultValuePipe(20), ParseIntPipe) pageSize: number,
    @Query("search") search?: string,
  ) {
    return this.students.findAll(user.schoolId, page, pageSize, search);
  }

  @Get(":id")
  @Roles(Role.ADMIN, Role.PRINCIPAL, Role.TEACHER)
  @ApiOperation({ summary: "Get student detail" })
  findOne(@Param("id") id: string, @CurrentUser() user: { schoolId: string }) {
    return this.students.findOne(id, user.schoolId);
  }

  @Post()
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: "Create student profile" })
  create(@Body() dto: CreateStudentDto, @CurrentUser() user: { id: string }) {
    return this.students.create(dto, user.id);
  }
}
