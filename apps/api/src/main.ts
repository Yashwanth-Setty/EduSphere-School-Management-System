import { NestFactory } from "@nestjs/core";
import { ValidationPipe, VersioningType } from "@nestjs/common";
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger";
import { ConfigService } from "@nestjs/config";
import helmet from "helmet";
import { AppModule } from "./app.module";
import { HttpExceptionFilter } from "./common/filters/http-exception.filter";
import { AuditInterceptor } from "./common/interceptors/audit.interceptor";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);

  app.use(helmet());

  app.enableCors({
    origin: config.get<string>("CORS_ORIGINS", "http://localhost:3000").split(","),
    credentials: true,
  });

  app.setGlobalPrefix("api");
  app.enableVersioning({ type: VersioningType.URI, defaultVersion: "1" });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.useGlobalFilters(new HttpExceptionFilter());

  const swaggerConfig = new DocumentBuilder()
    .setTitle("SPIRA API")
    .setDescription("School Parent Interaction & Resource Access — REST API")
    .setVersion("1.0")
    .addBearerAuth()
    .addTag("auth", "Authentication & session management")
    .addTag("users", "User profile & roles")
    .addTag("students", "Student management")
    .addTag("staff", "Faculty & staff management")
    .addTag("attendance", "Attendance sessions & records")
    .addTag("timetable", "Timetable management")
    .addTag("courses", "Courses & offerings")
    .addTag("exams", "Examinations & results")
    .addTag("fees", "Fee plans, invoices & payments")
    .addTag("announcements", "Communication & announcements")
    .addTag("documents", "Document management")
    .addTag("analytics", "Analytics & reports")
    .addTag("parent", "Parent portal endpoints")
    .addTag("ai", "AI-assisted features (feature-flagged)")
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup("api/docs", app, document);

  const port = config.get<number>("PORT", 4000);
  await app.listen(port);
  console.log(`SPIRA API running on http://localhost:${port}`);
  console.log(`OpenAPI docs: http://localhost:${port}/api/docs`);
}

bootstrap();
