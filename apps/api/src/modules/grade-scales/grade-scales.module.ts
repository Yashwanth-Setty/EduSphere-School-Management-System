import { Module } from "@nestjs/common";
import { GradeScalesService } from "./grade-scales.service";
import { GradeScalesController } from "./grade-scales.controller";

@Module({
  providers: [GradeScalesService],
  controllers: [GradeScalesController],
})
export class GradeScalesModule {}
