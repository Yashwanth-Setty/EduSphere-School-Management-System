import { IsOptional, IsString } from "class-validator";
import { ApiPropertyOptional } from "@nestjs/swagger";

export class SubmitAssignmentDto {
  @ApiPropertyOptional({ example: "https://storage.example.com/submission.pdf" })
  @IsOptional()
  @IsString()
  fileUrl?: string;
}
