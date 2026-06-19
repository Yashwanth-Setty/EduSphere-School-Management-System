import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsString, IsOptional, IsArray, IsInt, Min } from "class-validator";

export class CreateDocumentDto {
  @ApiProperty({ description: "short label: report_card | policy | circular | finance | counselor | general" })
  @IsString() category: string;

  @ApiProperty() @IsString() title: string;

  @ApiProperty({ description: "Storage key / simulated file path" })
  @IsString() storageKey: string;

  @ApiProperty({ example: "application/pdf" }) @IsString() mimeType: string;

  @ApiProperty() @IsInt() @Min(0) sizeBytes: number;

  @ApiPropertyOptional({
    description: "school_admin | section | student | finance | counselor",
    default: "school_admin",
  })
  @IsOptional() @IsString() visibilityScope?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional() @IsArray() @IsString({ each: true }) tags?: string[];

  @ApiPropertyOptional() @IsOptional() @IsString() retentionLabel?: string;
}
