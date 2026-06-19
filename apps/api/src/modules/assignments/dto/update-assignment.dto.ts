import { PartialType, OmitType } from "@nestjs/swagger";
import { CreateAssignmentDto } from "./create-assignment.dto";

export class UpdateAssignmentDto extends PartialType(OmitType(CreateAssignmentDto, ["courseOfferingId"] as const)) {}
