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
import { CoursesService } from "./courses.service";
import { CreateCourseDto } from "./dto/create-course.dto";
import { UpdateCourseDto } from "./dto/update-course.dto";
import { CreateOfferingDto } from "./dto/create-offering.dto";

@ApiTags("courses")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller("courses")
export class CoursesController {
  constructor(private courses: CoursesService) {}

  @Get()
  @Roles(Role.ADMIN, Role.PRINCIPAL, Role.TEACHER, Role.STUDENT)
  @ApiOperation({ summary: "List courses" })
  @ApiQuery({ name: "page", required: false })
  @ApiQuery({ name: "pageSize", required: false })
  @ApiQuery({ name: "search", required: false })
  @ApiQuery({ name: "activeOnly", required: false })
  findAll(
    @CurrentUser() user: { schoolId: string },
    @Query("page", new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query("pageSize", new DefaultValuePipe(20), ParseIntPipe) pageSize: number,
    @Query("search") search?: string,
    @Query("activeOnly") activeOnly?: string,
  ) {
    return this.courses.findAll(user.schoolId, page, pageSize, search, activeOnly === "true");
  }

  @Get(":id")
  @Roles(Role.ADMIN, Role.PRINCIPAL, Role.TEACHER, Role.STUDENT)
  @ApiOperation({ summary: "Get course detail with offerings" })
  findOne(@Param("id") id: string, @CurrentUser() user: { schoolId: string }) {
    return this.courses.findOne(id, user.schoolId);
  }

  @Post()
  @Roles(Role.ADMIN, Role.PRINCIPAL)
  @ApiOperation({ summary: "Create course" })
  create(@Body() dto: CreateCourseDto, @CurrentUser() user: { schoolId: string }) {
    return this.courses.create({ ...dto, schoolId: user.schoolId });
  }

  @Patch(":id")
  @Roles(Role.ADMIN, Role.PRINCIPAL)
  @ApiOperation({ summary: "Update course" })
  update(
    @Param("id") id: string,
    @Body() dto: UpdateCourseDto,
    @CurrentUser() user: { schoolId: string },
  ) {
    return this.courses.update(id, dto, user.schoolId);
  }

  @Post(":id/offerings")
  @Roles(Role.ADMIN, Role.PRINCIPAL)
  @ApiOperation({ summary: "Add course offering (assign to section + teacher)" })
  addOffering(
    @Param("id") courseId: string,
    @Body() dto: CreateOfferingDto,
    @CurrentUser() user: { schoolId: string },
  ) {
    return this.courses.addOffering(courseId, dto, user.schoolId);
  }
}
