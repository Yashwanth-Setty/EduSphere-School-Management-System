import { IsString, IsNotEmpty, IsInt, IsOptional, Min, Max } from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";

export class CreateSlotDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  sectionId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  courseOfferingId?: string;

  @ApiProperty({ description: "0=Monday … 4=Friday", minimum: 0, maximum: 6 })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(6)
  dayOfWeek: number;

  @ApiProperty({ minimum: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  periodNumber: number;

  @ApiProperty({ example: "08:00" })
  @IsString()
  @IsNotEmpty()
  startTime: string;

  @ApiProperty({ example: "08:45" })
  @IsString()
  @IsNotEmpty()
  endTime: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  roomLabel?: string;

  @ApiProperty({ example: "term_1" })
  @IsString()
  @IsNotEmpty()
  term: string;
}
