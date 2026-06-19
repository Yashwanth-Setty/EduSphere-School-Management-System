import { IsString, IsNotEmpty, IsOptional } from "class-validator";
import { ApiPropertyOptional, ApiProperty } from "@nestjs/swagger";

export class CreateCourseDto {
  @ApiPropertyOptional({ description: "Injected from JWT; ignored if provided in body" })
  @IsOptional()
  @IsString()
  schoolId: string;

  @ApiProperty({ example: "MATH-8" })
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiProperty({ example: "Mathematics Grade 8" })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;
}
