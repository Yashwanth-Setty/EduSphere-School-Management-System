import { IsString, IsNotEmpty, IsNumber, IsOptional, Min, Max } from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class CreateGradeScaleDto {
  @ApiProperty({ example: "clxxx..." })
  @IsString()
  @IsNotEmpty()
  gradeLevelId: string;

  @ApiProperty({ example: "A+" })
  @IsString()
  @IsNotEmpty()
  gradeLabel: string;

  @ApiProperty({ example: 90 })
  @IsNumber()
  @Min(0)
  @Max(100)
  minPercent: number;

  @ApiProperty({ example: 100 })
  @IsNumber()
  @Min(0)
  @Max(100)
  maxPercent: number;

  @ApiPropertyOptional({ example: 4.0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  gradePoint?: number;

  @ApiPropertyOptional({ example: "Outstanding" })
  @IsOptional()
  @IsString()
  description?: string;
}
