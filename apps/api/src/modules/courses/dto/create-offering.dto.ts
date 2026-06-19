import { IsString, IsNotEmpty, IsOptional } from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class CreateOfferingDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  sectionId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  teacherId?: string;

  @ApiProperty({ example: "term_1" })
  @IsString()
  @IsNotEmpty()
  academicTerm: string;
}
