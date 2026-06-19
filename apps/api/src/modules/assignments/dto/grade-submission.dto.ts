import { IsNumber, IsOptional, IsString, Min } from "class-validator";
import { ApiPropertyOptional } from "@nestjs/swagger";

export class GradeSubmissionDto {
  @ApiPropertyOptional({ example: 45 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  grade?: number;

  @ApiPropertyOptional({ example: "Good work! Review question 3." })
  @IsOptional()
  @IsString()
  feedback?: string;
}
