import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsString, IsNumber, IsOptional, Min } from "class-validator";

export class RecordPaymentDto {
  @ApiProperty() @IsNumber() @Min(0.01) amount: number;
  @ApiProperty({ description: "cash | bank_transfer | card | cheque | online" }) @IsString() method: string;
  @ApiPropertyOptional() @IsOptional() @IsString() referenceNo?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() gatewayRef?: string;
}
