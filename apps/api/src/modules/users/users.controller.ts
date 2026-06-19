import { Controller, Get, UseGuards } from "@nestjs/common";
import { ApiTags, ApiBearerAuth, ApiOperation } from "@nestjs/swagger";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";
import { Role } from "../../shared";
import { UsersService } from "./users.service";
import { CurrentUser } from "../../common/decorators/current-user.decorator";

@ApiTags("users")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller("users")
export class UsersController {
  constructor(private users: UsersService) {}

  @Get("me")
  @ApiOperation({ summary: "Current user profile with roles" })
  me(@CurrentUser() user: unknown) {
    return user;
  }
}
