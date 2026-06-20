import {
  Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards,
} from "@nestjs/common";
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from "@nestjs/swagger";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { Role } from "../../shared";
import { TimetableService } from "./timetable.service";
import { CreateSlotDto } from "./dto/create-slot.dto";
import { UpdateSlotDto } from "./dto/update-slot.dto";

@ApiTags("timetable")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller("timetable")
export class TimetableController {
  constructor(private timetable: TimetableService) {}

  @Get("slots")
  @Roles(Role.STUDENT, Role.PARENT)
  @ApiOperation({ summary: "Get timetable slots for the current student" })
  getSlots(@CurrentUser() user: { id: string; schoolId: string }) {
    return this.timetable.getSlotsForStudent(user.schoolId, user.id);
  }

  @Get("sections")
  @Roles(Role.ADMIN, Role.PRINCIPAL, Role.TEACHER, Role.STUDENT, Role.PARENT)
  @ApiOperation({ summary: "List all sections for section picker" })
  listSections(@CurrentUser() user: { schoolId: string }) {
    return this.timetable.listSections(user.schoolId);
  }

  @Get("section/:sectionId")
  @Roles(Role.ADMIN, Role.PRINCIPAL, Role.TEACHER, Role.STUDENT, Role.PARENT)
  @ApiOperation({ summary: "Get timetable for a section" })
  @ApiQuery({ name: "term", required: true })
  findBySection(
    @Param("sectionId") sectionId: string,
    @Query("term") term: string,
    @CurrentUser() user: { schoolId: string },
  ) {
    return this.timetable.findBySection(sectionId, term ?? "term_1", user.schoolId);
  }

  @Post()
  @Roles(Role.ADMIN, Role.PRINCIPAL)
  @ApiOperation({ summary: "Create a timetable slot" })
  create(@Body() dto: CreateSlotDto, @CurrentUser() user: { schoolId: string }) {
    return this.timetable.createSlot(dto, user.schoolId);
  }

  @Patch(":id")
  @Roles(Role.ADMIN, Role.PRINCIPAL)
  @ApiOperation({ summary: "Update a timetable slot" })
  update(
    @Param("id") id: string,
    @Body() dto: UpdateSlotDto,
    @CurrentUser() user: { schoolId: string },
  ) {
    return this.timetable.updateSlot(id, dto, user.schoolId);
  }

  @Delete(":id")
  @Roles(Role.ADMIN, Role.PRINCIPAL)
  @ApiOperation({ summary: "Delete a timetable slot" })
  remove(@Param("id") id: string, @CurrentUser() user: { schoolId: string }) {
    return this.timetable.deleteSlot(id, user.schoolId);
  }
}
