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
import { AssignmentsModule } from "./modules/assignments/assignments.module";
import { ExamsModule } from "./modules/exams/exams.module";
import { GradeScalesModule } from "./modules/grade-scales/grade-scales.module";
import { FeesModule } from "./modules/fees/fees.module";
import { DocumentsModule } from "./modules/documents/documents.module";
import { AnnouncementsModule } from "./modules/announcements/announcements.module";
import { AnalyticsModule } from "./modules/analytics/analytics.module";
import { AiModule } from "./modules/ai/ai.module";
import { TransportModule } from "./modules/transport/transport.module";
import { OnlineClassesModule } from "./modules/online-classes/online-classes.module";

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
    AssignmentsModule,
    ExamsModule,
    GradeScalesModule,
    FeesModule,
    DocumentsModule,
    AnnouncementsModule,
    AnalyticsModule,
    AiModule,
    TransportModule,
    OnlineClassesModule,
  ],
})
export class AppModule {}
