import { IsString, IsNotEmpty, IsOptional, IsDateString, IsNumber, IsBoolean, Min } from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class CreateExamDto {
  @ApiProperty({ example: "clxxx..." })
  @IsString()
  @IsNotEmpty()
  courseOfferingId: string;

  @ApiProperty({ example: "clxxx..." })
  @IsString()
  @IsNotEmpty()
  academicYearId: string;

  @ApiProperty({ example: "Mid-Term Mathematics" })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ example: "midterm", description: "midterm | final | unit | practical" })
  @IsString()
  @IsNotEmpty()
  examType: string;

  @ApiProperty({ example: "term_1" })
  @IsString()
  @IsNotEmpty()
  term: string;

  @ApiPropertyOptional({ example: 1.0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  weight?: number;

  @ApiProperty({ example: 100 })
  @IsNumber()
  @Min(1)
  maxMarks: number;

  @ApiPropertyOptional({ example: "2026-08-20T09:00:00.000Z" })
  @IsOptional()
  @IsDateString()
  examDate?: string;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;
}
