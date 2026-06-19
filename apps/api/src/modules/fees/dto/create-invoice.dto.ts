import { ApiProperty } from "@nestjs/swagger";
import { IsString, IsNumber, IsDateString, Min } from "class-validator";

export class CreateInvoiceDto {
  @ApiProperty() @IsString() feePlanId: string;
  @ApiProperty() @IsString() studentProfileId: string;
  @ApiProperty() @IsNumber() @Min(0) amountDue: number;
  @ApiProperty() @IsDateString() dueDate: string;
}
