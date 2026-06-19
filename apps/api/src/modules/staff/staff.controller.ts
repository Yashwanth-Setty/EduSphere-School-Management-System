import { Controller, Get, Param, Query, UseGuards, ParseIntPipe, DefaultValuePipe } from "@nestjs/common";
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from "@nestjs/swagger";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { Role } from "../../shared";
import { StaffService } from "./staff.service";

@ApiTags("staff")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller("staff")
export class StaffController {
  constructor(private staff: StaffService) {}

  @Get()
  @Roles(Role.ADMIN, Role.PRINCIPAL)
  @ApiOperation({ summary: "List/search staff" })
  @ApiQuery({ name: "page", required: false })
  @ApiQuery({ name: "pageSize", required: false })
  @ApiQuery({ name: "search", required: false })
  findAll(
    @CurrentUser() user: { schoolId: string },
    @Query("page", new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query("pageSize", new DefaultValuePipe(20), ParseIntPipe) pageSize: number,
    @Query("search") search?: string,
  ) {
    return this.staff.findAll(user.schoolId, page, pageSize, search);
  }

  @Get(":id")
  @Roles(Role.ADMIN, Role.PRINCIPAL)
  @ApiOperation({ summary: "Get staff detail" })
  findOne(@Param("id") id: string, @CurrentUser() user: { schoolId: string }) {
    return this.staff.findOne(id, user.schoolId);
  }
}
