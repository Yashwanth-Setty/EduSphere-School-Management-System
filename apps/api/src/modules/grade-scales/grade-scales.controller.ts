import { Controller, Get, Post, Delete, Param, Body, Query, UseGuards } from "@nestjs/common";
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from "@nestjs/swagger";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { Role } from "../../shared";
import { GradeScalesService } from "./grade-scales.service";
import { CreateGradeScaleDto } from "./dto/create-grade-scale.dto";

interface JwtUser { id: string; schoolId: string }

@ApiTags("grade-scales")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller("grade-scales")
export class GradeScalesController {
  constructor(private service: GradeScalesService) {}

  @Get()
  @Roles(Role.ADMIN, Role.PRINCIPAL, Role.TEACHER)
  @ApiOperation({ summary: "List grade scales" })
  @ApiQuery({ name: "gradeLevelId", required: false })
  findAll(@CurrentUser() user: JwtUser, @Query("gradeLevelId") gradeLevelId?: string) {
    return this.service.findAll(user.schoolId, gradeLevelId);
  }

  @Get("grade-levels")
  @Roles(Role.ADMIN, Role.PRINCIPAL, Role.TEACHER)
  @ApiOperation({ summary: "List grade levels for this school" })
  findGradeLevels(@CurrentUser() user: JwtUser) {
    return this.service.findGradeLevels(user.schoolId);
  }

  @Post()
  @Roles(Role.ADMIN, Role.PRINCIPAL)
  @ApiOperation({ summary: "Create grade scale entry" })
  create(@Body() dto: CreateGradeScaleDto, @CurrentUser() user: JwtUser) {
    return this.service.create(dto, user.schoolId);
  }

  @Delete(":id")
  @Roles(Role.ADMIN, Role.PRINCIPAL)
  @ApiOperation({ summary: "Delete grade scale entry" })
  remove(@Param("id") id: string, @CurrentUser() user: JwtUser) {
    return this.service.remove(id, user.schoolId);
  }
}
