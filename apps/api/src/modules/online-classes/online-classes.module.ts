import { Module } from "@nestjs/common";
import { OnlineClassesController } from "./online-classes.controller";
import { OnlineClassesService } from "./online-classes.service";

@Module({
  controllers: [OnlineClassesController],
  providers: [OnlineClassesService],
})
export class OnlineClassesModule {}
