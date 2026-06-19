import { IsArray, IsNotEmpty, IsNumber, IsOptional, IsString, Min, ValidateNested } from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";

export class ResultEntryDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  studentProfileId: string;

  @ApiPropertyOptional({ example: 78.5 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  marksObtained?: number;

  @ApiPropertyOptional({ example: "A" })
  @IsOptional()
  @IsString()
  grade?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  remarks?: string;
}

export class EnterResultsDto {
  @ApiProperty({ type: [ResultEntryDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ResultEntryDto)
  results: ResultEntryDto[];
}
