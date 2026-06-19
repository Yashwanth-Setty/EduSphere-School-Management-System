import {
  Controller,
  Get,
  Post,
  Patch,
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
import { AnnouncementsService } from "./announcements.service";
import { CreateAnnouncementDto } from "./dto/create-announcement.dto";
import { UpdateAnnouncementDto } from "./dto/update-announcement.dto";

const ALL_ROLES = Object.values(Role);

@ApiTags("announcements")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller("announcements")
export class AnnouncementsController {
  constructor(private service: AnnouncementsService) {}

  @Get("notifications")
  @Roles(...ALL_ROLES)
  @ApiOperation({ summary: "Notification feed – recent published announcements for caller" })
  getNotifications(@CurrentUser() user: { schoolId: string; roles: string[] }) {
    return this.service.getNotificationFeed(user.schoolId, user.roles);
  }

  @Get()
  @Roles(...ALL_ROLES)
  @ApiOperation({ summary: "List announcements scoped to caller role" })
  @ApiQuery({ name: "page", required: false })
  @ApiQuery({ name: "pageSize", required: false })
  @ApiQuery({ name: "includeUnpublished", required: false, type: Boolean })
  findAll(
    @CurrentUser() user: { schoolId: string; roles: string[] },
    @Query("page", new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query("pageSize", new DefaultValuePipe(20), ParseIntPipe) pageSize: number,
    @Query("includeUnpublished") includeUnpublished?: string,
  ) {
    return this.service.findAll(user.schoolId, user.roles, {
      page,
      pageSize,
      includeUnpublished: includeUnpublished === "true",
    });
  }

  @Get(":id")
  @Roles(...ALL_ROLES)
  @ApiOperation({ summary: "Get announcement detail" })
  findOne(
    @Param("id") id: string,
    @CurrentUser() user: { schoolId: string; roles: string[] },
  ) {
    return this.service.findOne(id, user.schoolId, user.roles);
  }

  @Post()
  @Roles(Role.ADMIN, Role.PRINCIPAL, Role.TEACHER)
  @ApiOperation({ summary: "Create an announcement" })
  create(
    @Body() dto: CreateAnnouncementDto,
    @CurrentUser() user: { id: string; schoolId: string },
  ) {
    return this.service.create(dto, user.schoolId, user.id);
  }

  @Patch(":id")
  @Roles(Role.ADMIN, Role.PRINCIPAL, Role.TEACHER)
  @ApiOperation({ summary: "Update / publish an announcement" })
  update(
    @Param("id") id: string,
    @Body() dto: UpdateAnnouncementDto,
    @CurrentUser() user: { schoolId: string; roles: string[] },
  ) {
    return this.service.update(id, dto, user.schoolId, user.roles);
  }
}
