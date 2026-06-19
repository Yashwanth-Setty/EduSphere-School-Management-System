import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsString, IsOptional, IsBoolean, IsDateString } from "class-validator";

export class CreateAnnouncementDto {
  @ApiProperty() @IsString() title: string;

  @ApiProperty() @IsString() body: string;

  @ApiPropertyOptional({
    description: "school | teachers | students | parents | section",
    default: "school",
  })
  @IsOptional() @IsString() audienceScope?: string;

  @ApiPropertyOptional({ description: "in_app | email | sms", default: "in_app" })
  @IsOptional() @IsString() channel?: string;

  @ApiPropertyOptional() @IsOptional() @IsBoolean() isPublished?: boolean;

  @ApiPropertyOptional() @IsOptional() @IsDateString() expiresAt?: string;
}
