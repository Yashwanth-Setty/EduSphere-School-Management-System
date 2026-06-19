import { IsString, IsEmail, IsDateString, IsOptional, IsArray, ValidateNested } from "class-validator";
import { Type } from "class-transformer";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

class GuardianLinkDto {
  @ApiProperty() @IsString() parentUserId: string;
  @ApiProperty() @IsString() relationLabel: string;
  @ApiPropertyOptional() @IsOptional() isPrimaryContact?: boolean;
  @ApiPropertyOptional() @IsOptional() billingContact?: boolean;
}

export class CreateStudentDto {
  @ApiProperty() @IsString() schoolId: string;
  @ApiPropertyOptional() @IsOptional() @IsString() sectionId?: string;
  @ApiProperty() @IsString() admissionNo: string;
  @ApiProperty() @IsString() firstName: string;
  @ApiProperty() @IsString() lastName: string;
  @ApiProperty() @IsDateString() dob: string;
  @ApiProperty() @IsString() gender: string;
  @ApiPropertyOptional() @IsOptional() @IsEmail() email?: string;
  @ApiPropertyOptional({ type: [GuardianLinkDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => GuardianLinkDto)
  guardianLinks?: GuardianLinkDto[];
}
