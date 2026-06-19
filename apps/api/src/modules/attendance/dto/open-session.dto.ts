import { IsString, IsNotEmpty, IsInt, IsDateString, Min, Max } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";

export class OpenSessionDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  sectionId: string;

  @ApiProperty({ example: "2026-06-19" })
  @IsDateString()
  sessionDate: string;

  @ApiProperty({ minimum: 1, maximum: 10 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(10)
  periodNumber: number;
}
