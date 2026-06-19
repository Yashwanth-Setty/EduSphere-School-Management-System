import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsString, IsOptional, IsBoolean, IsDateString } from "class-validator";

export class UpdateAnnouncementDto {
  @ApiPropertyOptional() @IsOptional() @IsString() title?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() body?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() audienceScope?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() channel?: string;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isPublished?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsDateString() expiresAt?: string;
}
