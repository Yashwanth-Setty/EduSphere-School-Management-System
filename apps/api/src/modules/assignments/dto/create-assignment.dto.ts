import { IsString, IsNotEmpty, IsOptional, IsDateString, IsNumber, IsBoolean, Min } from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class CreateAssignmentDto {
  @ApiProperty({ example: "clxxx..." })
  @IsString()
  @IsNotEmpty()
  courseOfferingId: string;

  @ApiProperty({ example: "Chapter 5 Exercises" })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiPropertyOptional({ example: "Complete all questions from page 42–44." })
  @IsOptional()
  @IsString()
  instructions?: string;

  @ApiProperty({ example: "2026-07-15T00:00:00.000Z" })
  @IsDateString()
  dueDate: string;

  @ApiPropertyOptional({ example: 50 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  maxScore?: number;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;
}
