import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { ThrottlerModule } from "@nestjs/throttler";
import { PrismaModule } from "./config/prisma.module";
import { AuthModule } from "./modules/auth/auth.module";
import { UsersModule } from "./modules/users/users.module";
import { StudentsModule } from "./modules/students/students.module";
import { StaffModule } from "./modules/staff/staff.module";
import { AttendanceModule } from "./modules/attendance/attendance.module";
import { CoursesModule } from "./modules/courses/courses.module";
import { TimetableModule } from "./modules/timetable/timetable.module";
import { HealthModule } from "./modules/health/health.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: ".env" }),
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 100 }]),
    PrismaModule,
    AuthModule,
    UsersModule,
    StudentsModule,
    StaffModule,
    AttendanceModule,
    CoursesModule,
    TimetableModule,
    HealthModule,
  ],
})
export class AppModule {}
