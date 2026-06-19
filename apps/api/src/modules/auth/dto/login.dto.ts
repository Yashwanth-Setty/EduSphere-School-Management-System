import { IsEmail, IsNotEmpty, IsString, MinLength } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class LoginDto {
  @ApiProperty({ example: "spira-demo" })
  @IsString()
  @IsNotEmpty()
  schoolCode: string;

  @ApiProperty({ example: "admin@spira.school" })
  @IsEmail()
  email: string;

  @ApiProperty({ example: "••••••••", minLength: 8 })
  @IsString()
  @MinLength(8)
  password: string;
}
