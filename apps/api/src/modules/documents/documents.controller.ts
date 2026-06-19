import {
  Controller,
  Get,
  Post,
  Delete,
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
import { DocumentsService } from "./documents.service";
import { CreateDocumentDto } from "./dto/create-document.dto";

const ALL_ROLES = Object.values(Role);

@ApiTags("documents")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller("documents")
export class DocumentsController {
  constructor(private docs: DocumentsService) {}

  @Get()
  @Roles(...ALL_ROLES)
  @ApiOperation({ summary: "List documents (scoped to caller role)" })
  @ApiQuery({ name: "page", required: false })
  @ApiQuery({ name: "pageSize", required: false })
  @ApiQuery({ name: "category", required: false })
  @ApiQuery({ name: "search", required: false })
  findAll(
    @CurrentUser() user: { id: string; schoolId: string; roles: string[] },
    @Query("page", new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query("pageSize", new DefaultValuePipe(20), ParseIntPipe) pageSize: number,
    @Query("category") category?: string,
    @Query("search") search?: string,
  ) {
    return this.docs.findAll(user.schoolId, user.roles, { page, pageSize, category, search });
  }

  @Get(":id")
  @Roles(...ALL_ROLES)
  @ApiOperation({ summary: "Get document detail" })
  findOne(
    @Param("id") id: string,
    @CurrentUser() user: { schoolId: string; roles: string[] },
  ) {
    return this.docs.findOne(id, user.schoolId, user.roles);
  }

  @Post()
  @Roles(Role.ADMIN, Role.PRINCIPAL, Role.TEACHER, Role.COUNSELOR, Role.ACCOUNTANT)
  @ApiOperation({ summary: "Upload / register a document" })
  create(
    @Body() dto: CreateDocumentDto,
    @CurrentUser() user: { id: string; schoolId: string },
  ) {
    return this.docs.create(dto, user.schoolId, user.id);
  }

  @Delete(":id")
  @Roles(Role.ADMIN, Role.PRINCIPAL)
  @ApiOperation({ summary: "Soft-delete a document" })
  remove(
    @Param("id") id: string,
    @CurrentUser() user: { schoolId: string },
  ) {
    return this.docs.softDelete(id, user.schoolId);
  }
}
