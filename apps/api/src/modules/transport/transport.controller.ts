import { Controller, Get, Post, Patch, Param, Body, UseGuards } from "@nestjs/common";
import { ApiTags, ApiBearerAuth, ApiOperation } from "@nestjs/swagger";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { Role } from "../../shared";
import { TransportService } from "./transport.service";

const ALL_ROLES = Object.values(Role);

@ApiTags("transport")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller("transport")
export class TransportController {
  constructor(private service: TransportService) {}

  @Get("my-route")
  @Roles(Role.STUDENT, Role.PARENT)
  @ApiOperation({ summary: "Get current user's transport assignment" })
  getMyRoute(@CurrentUser() user: { id: string; schoolId: string }) {
    return this.service.findMyRoute(user.schoolId, user.id);
  }

  @Get()
  @Roles(...ALL_ROLES)
  @ApiOperation({ summary: "List all transport routes" })
  findAll(@CurrentUser() user: { schoolId: string }) {
    return this.service.findAll(user.schoolId);
  }

  @Get(":id")
  @Roles(...ALL_ROLES)
  @ApiOperation({ summary: "Get transport route detail" })
  findOne(@Param("id") id: string, @CurrentUser() user: { schoolId: string }) {
    return this.service.findOne(id, user.schoolId);
  }

  @Post()
  @Roles(Role.ADMIN, Role.PRINCIPAL)
  @ApiOperation({ summary: "Create a transport route" })
  create(
    @Body() dto: { routeName: string; vehicleNumber: string; driverName: string; driverPhone?: string; capacity?: number; status?: string },
    @CurrentUser() user: { schoolId: string },
  ) {
    return this.service.create(user.schoolId, dto);
  }

  @Patch(":id")
  @Roles(Role.ADMIN, Role.PRINCIPAL)
  @ApiOperation({ summary: "Update a transport route" })
  update(
    @Param("id") id: string,
    @Body() dto: Partial<{ routeName: string; vehicleNumber: string; driverName: string; driverPhone: string; capacity: number; status: string }>,
    @CurrentUser() user: { schoolId: string },
  ) {
    return this.service.update(id, user.schoolId, dto);
  }
}
