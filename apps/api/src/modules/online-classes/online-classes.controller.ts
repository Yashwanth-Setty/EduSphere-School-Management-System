import {
  Controller, Get, Post, Patch, Param, Body, Query,
  UseGuards, ParseIntPipe, DefaultValuePipe,
} from "@nestjs/common";
import { ApiTags, ApiBearerAuth, ApiOperation } from "@nestjs/swagger";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { Role } from "../../shared";
import { OnlineClassesService } from "./online-classes.service";

const ALL_ROLES = Object.values(Role);

@ApiTags("online-classes")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller("online-classes")
export class OnlineClassesController {
  constructor(private service: OnlineClassesService) {}

  @Get()
  @Roles(...ALL_ROLES)
  @ApiOperation({ summary: "List online classes" })
  findAll(
    @CurrentUser() user: { schoolId: string },
    @Query("page", new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query("pageSize", new DefaultValuePipe(20), ParseIntPipe) pageSize: number,
  ) {
    return this.service.findAll(user.schoolId, page, pageSize);
  }

  @Get(":id")
  @Roles(...ALL_ROLES)
  @ApiOperation({ summary: "Get online class detail" })
  findOne(@Param("id") id: string, @CurrentUser() user: { schoolId: string }) {
    return this.service.findOne(id, user.schoolId);
  }

  @Post()
  @Roles(Role.ADMIN, Role.PRINCIPAL, Role.TEACHER)
  @ApiOperation({ summary: "Create an online class" })
  create(
    @Body() dto: { courseOfferingId: string; title: string; scheduledAt: string; durationMins?: number; meetingLink: string; status?: string },
    @CurrentUser() user: { id: string; schoolId: string },
  ) {
    return this.service.create(user.schoolId, user.id, dto);
  }

  @Patch(":id")
  @Roles(Role.ADMIN, Role.PRINCIPAL, Role.TEACHER)
  @ApiOperation({ summary: "Update an online class" })
  update(
    @Param("id") id: string,
    @Body() dto: Partial<{ title: string; scheduledAt: string; durationMins: number; meetingLink: string; status: string }>,
    @CurrentUser() user: { id: string; schoolId: string; roles: string[] },
  ) {
    return this.service.update(id, user.schoolId, user.id, user.roles, dto);
  }
}
