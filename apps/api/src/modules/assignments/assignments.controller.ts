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
import { AssignmentsService } from "./assignments.service";
import { CreateAssignmentDto } from "./dto/create-assignment.dto";
import { UpdateAssignmentDto } from "./dto/update-assignment.dto";
import { GradeSubmissionDto } from "./dto/grade-submission.dto";
import { SubmitAssignmentDto } from "./dto/submit-assignment.dto";

interface JwtUser { id: string; schoolId: string; roles: Role[] }

@ApiTags("assignments")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller("assignments")
export class AssignmentsController {
  constructor(private service: AssignmentsService) {}

  @Get()
  @Roles(Role.ADMIN, Role.PRINCIPAL, Role.TEACHER, Role.STUDENT, Role.PARENT)
  @ApiOperation({ summary: "List assignments" })
  @ApiQuery({ name: "courseOfferingId", required: false })
  @ApiQuery({ name: "page", required: false })
  @ApiQuery({ name: "pageSize", required: false })
  findAll(
    @CurrentUser() user: JwtUser,
    @Query("courseOfferingId") courseOfferingId?: string,
    @Query("page", new DefaultValuePipe(1), ParseIntPipe) page = 1,
    @Query("pageSize", new DefaultValuePipe(20), ParseIntPipe) pageSize = 20,
  ) {
    return this.service.findAll(user.schoolId, courseOfferingId, page, pageSize);
  }

  @Get(":id")
  @Roles(Role.ADMIN, Role.PRINCIPAL, Role.TEACHER, Role.STUDENT, Role.PARENT)
  @ApiOperation({ summary: "Get assignment detail" })
  findOne(@Param("id") id: string, @CurrentUser() user: JwtUser) {
    return this.service.findOne(id, user.schoolId);
  }

  @Post()
  @Roles(Role.ADMIN, Role.PRINCIPAL, Role.TEACHER)
  @ApiOperation({ summary: "Create assignment" })
  create(@Body() dto: CreateAssignmentDto, @CurrentUser() user: JwtUser) {
    return this.service.create(dto, user.schoolId);
  }

  @Patch(":id")
  @Roles(Role.ADMIN, Role.PRINCIPAL, Role.TEACHER)
  @ApiOperation({ summary: "Update assignment" })
  update(@Param("id") id: string, @Body() dto: UpdateAssignmentDto, @CurrentUser() user: JwtUser) {
    return this.service.update(id, dto, user.schoolId);
  }

  @Get(":id/submissions")
  @Roles(Role.ADMIN, Role.PRINCIPAL, Role.TEACHER)
  @ApiOperation({ summary: "List all submissions for an assignment (teacher view)" })
  getSubmissions(@Param("id") id: string, @CurrentUser() user: JwtUser) {
    return this.service.getSubmissions(id, user.schoolId);
  }

  @Post(":id/submit")
  @Roles(Role.STUDENT)
  @ApiOperation({ summary: "Submit assignment (student)" })
  async submit(
    @Param("id") assignmentId: string,
    @Body() dto: SubmitAssignmentDto,
    @CurrentUser() user: JwtUser,
  ) {
    const profileId = await this.service.getStudentProfileId(user.id);
    if (!profileId) throw new Error("Student profile not found");
    return this.service.submit(assignmentId, profileId, dto);
  }

  @Get(":id/my-submission")
  @Roles(Role.STUDENT)
  @ApiOperation({ summary: "Get my submission for this assignment" })
  async getMySubmission(@Param("id") assignmentId: string, @CurrentUser() user: JwtUser) {
    const profileId = await this.service.getStudentProfileId(user.id);
    if (!profileId) return null;
    return this.service.getMySubmission(assignmentId, profileId);
  }

  @Patch(":id/submissions/:submissionId/grade")
  @Roles(Role.ADMIN, Role.PRINCIPAL, Role.TEACHER)
  @ApiOperation({ summary: "Grade a submission" })
  gradeSubmission(
    @Param("submissionId") submissionId: string,
    @Body() dto: GradeSubmissionDto,
    @CurrentUser() user: JwtUser,
  ) {
    return this.service.gradeSubmission(submissionId, dto, user.schoolId);
  }
}
