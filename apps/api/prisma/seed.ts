import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding SPIRA demo data...");

  // Roles
  const roles = ["admin", "principal", "teacher", "student", "parent", "accountant", "counselor"];
  for (const name of roles) {
    await prisma.role.upsert({ where: { name }, update: {}, create: { name } });
  }

  // Demo school
  const school = await prisma.school.upsert({
    where: { code: "spira-demo" },
    update: {},
    create: {
      code: "spira-demo",
      name: "SPIRA Demo School",
      address: "123 Education Lane, Knowledge City",
      timezone: "UTC",
    },
  });

  // Academic year
  const ay = await prisma.academicYear.upsert({
    where: { schoolId_name: { schoolId: school.id, name: "2026-27" } },
    update: {},
    create: {
      schoolId: school.id,
      name: "2026-27",
      startDate: new Date("2026-06-01"),
      endDate: new Date("2027-03-31"),
      isCurrent: true,
    },
  });

  // Grade levels
  const grade8 = await prisma.gradeLevel.upsert({
    where: { schoolId_name: { schoolId: school.id, name: "Grade 8" } },
    update: {},
    create: { schoolId: school.id, name: "Grade 8", displayOrder: 8 },
  });

  // Section
  const section = await prisma.section.upsert({
    where: { academicYearId_gradeLevelId_name: { academicYearId: ay.id, gradeLevelId: grade8.id, name: "8-A" } },
    update: {},
    create: { schoolId: school.id, academicYearId: ay.id, gradeLevelId: grade8.id, name: "8-A" },
  });

  const hash = (p: string) => bcrypt.hash(p, 12);
  const adminRole = await prisma.role.findUnique({ where: { name: "admin" } });
  const principalRole = await prisma.role.findUnique({ where: { name: "principal" } });
  const teacherRole = await prisma.role.findUnique({ where: { name: "teacher" } });
  const studentRole = await prisma.role.findUnique({ where: { name: "student" } });
  const parentRole = await prisma.role.findUnique({ where: { name: "parent" } });
  const accountantRole = await prisma.role.findUnique({ where: { name: "accountant" } });
  const counselorRole = await prisma.role.findUnique({ where: { name: "counselor" } });

  const createUser = async (
    email: string,
    displayName: string,
    password: string,
    roleId: string,
  ) => {
    return prisma.user.upsert({
      where: { schoolId_email: { schoolId: school.id, email } },
      update: {},
      create: {
        schoolId: school.id,
        email,
        displayName,
        passwordHash: await hash(password),
        userRoles: { create: { roleId } },
      },
    });
  };

  await createUser("admin@spira.school", "SPIRA Admin", "Admin@1234!", adminRole!.id);
  await createUser("principal@spira.school", "Dr. Meena Sharma", "Principal@1234!", principalRole!.id);
  const teacher = await createUser("teacher@spira.school", "Raj Kumar", "Teacher@1234!", teacherRole!.id);
  await createUser("accountant@spira.school", "Priya Accounts", "Account@1234!", accountantRole!.id);
  await createUser("counselor@spira.school", "Sunita Counsel", "Counsel@1234!", counselorRole!.id);

  // Staff profile for teacher
  await prisma.staffProfile.upsert({
    where: { userId: teacher.id },
    update: {},
    create: {
      userId: teacher.id,
      schoolId: school.id,
      employeeNo: "EMP-001",
      firstName: "Raj",
      lastName: "Kumar",
      designation: "Senior Teacher",
      department: "Science",
      joinedAt: new Date("2020-06-01"),
    },
  });

  // Student user + profile
  const studentUser = await createUser("ava.patel@student.spira", "Ava Patel", "Student@1234!", studentRole!.id);
  await prisma.studentProfile.upsert({
    where: { userId: studentUser.id },
    update: {},
    create: {
      userId: studentUser.id,
      schoolId: school.id,
      sectionId: section.id,
      admissionNo: "ADM-2026-0001",
      firstName: "Ava",
      lastName: "Patel",
      dob: new Date("2012-04-15"),
      gender: "female",
    },
  });

  // Parent user + profile
  const parentUser = await createUser("parent@spira.school", "Anjali Patel", "Parent@1234!", parentRole!.id);
  const parentProfile = await prisma.parentProfile.upsert({
    where: { userId: parentUser.id },
    update: {},
    create: { userId: parentUser.id, firstName: "Anjali", lastName: "Patel" },
  });
  const studentProfile = await prisma.studentProfile.findUnique({ where: { userId: studentUser.id } });
  if (studentProfile) {
    await prisma.parentStudentLink.upsert({
      where: { parentProfileId_studentProfileId: { parentProfileId: parentProfile.id, studentProfileId: studentProfile.id } },
      update: {},
      create: {
        parentProfileId: parentProfile.id,
        studentProfileId: studentProfile.id,
        relationLabel: "Mother",
        isPrimaryContact: true,
        billingContact: true,
      },
    });
  }

  // Courses
  const staffProfile = await prisma.staffProfile.findFirst({ where: { userId: teacher.id } });

  const courses = [
    { code: "MATH-8", name: "Mathematics Grade 8", description: "Algebra, geometry, and statistics" },
    { code: "SCI-8", name: "Science Grade 8", description: "Physics, chemistry and biology basics" },
    { code: "ENG-8", name: "English Grade 8", description: "Literature and language skills" },
    { code: "SOC-8", name: "Social Studies Grade 8", description: "History and civics" },
  ];

  const createdCourses: Record<string, string> = {};
  for (const c of courses) {
    const course = await prisma.course.upsert({
      where: { schoolId_code: { schoolId: school.id, code: c.code } },
      update: {},
      create: { schoolId: school.id, ...c },
    });
    createdCourses[c.code] = course.id;
  }

  // Course offerings (assign Math + Science to 8-A for term_1 with teacher)
  const mathOffering = await prisma.courseOffering.upsert({
    where: { courseId_sectionId_academicTerm: { courseId: createdCourses["MATH-8"], sectionId: section.id, academicTerm: "term_1" } },
    update: {},
    create: { courseId: createdCourses["MATH-8"], sectionId: section.id, teacherId: staffProfile?.id, academicTerm: "term_1" },
  });

  const sciOffering = await prisma.courseOffering.upsert({
    where: { courseId_sectionId_academicTerm: { courseId: createdCourses["SCI-8"], sectionId: section.id, academicTerm: "term_1" } },
    update: {},
    create: { courseId: createdCourses["SCI-8"], sectionId: section.id, teacherId: staffProfile?.id, academicTerm: "term_1" },
  });

  // Timetable slots for 8-A term_1 (Mon–Fri, periods 1–3)
  const slots = [
    { dayOfWeek: 0, periodNumber: 1, startTime: "08:00", endTime: "08:45", courseOfferingId: mathOffering.id, roomLabel: "Room 101" },
    { dayOfWeek: 0, periodNumber: 2, startTime: "08:50", endTime: "09:35", courseOfferingId: sciOffering.id, roomLabel: "Lab A" },
    { dayOfWeek: 1, periodNumber: 1, startTime: "08:00", endTime: "08:45", courseOfferingId: sciOffering.id, roomLabel: "Lab A" },
    { dayOfWeek: 1, periodNumber: 2, startTime: "08:50", endTime: "09:35", courseOfferingId: mathOffering.id, roomLabel: "Room 101" },
    { dayOfWeek: 2, periodNumber: 1, startTime: "08:00", endTime: "08:45", courseOfferingId: mathOffering.id, roomLabel: "Room 101" },
    { dayOfWeek: 3, periodNumber: 1, startTime: "08:00", endTime: "08:45", courseOfferingId: sciOffering.id, roomLabel: "Lab A" },
    { dayOfWeek: 4, periodNumber: 1, startTime: "08:00", endTime: "08:45", courseOfferingId: mathOffering.id, roomLabel: "Room 101" },
  ];

  for (const slot of slots) {
    await prisma.timetableSlot.upsert({
      where: { sectionId_dayOfWeek_periodNumber_term: { sectionId: section.id, dayOfWeek: slot.dayOfWeek, periodNumber: slot.periodNumber, term: "term_1" } },
      update: {},
      create: { sectionId: section.id, term: "term_1", ...slot },
    });
  }

  // Demo attendance session (today, period 1, already submitted)
  const studentProfileRecord = await prisma.studentProfile.findFirst({ where: { userId: studentUser.id } });
  const demoSession = await prisma.attendanceSession.upsert({
    where: { sectionId_sessionDate_periodNumber: { sectionId: section.id, sessionDate: new Date("2026-06-19T00:00:00Z"), periodNumber: 1 } },
    update: {},
    create: {
      schoolId: school.id,
      sectionId: section.id,
      teacherId: staffProfile?.id,
      sessionDate: new Date("2026-06-19T00:00:00Z"),
      periodNumber: 1,
      submittedAt: new Date("2026-06-19T08:45:00Z"),
    },
  });

  if (studentProfileRecord) {
    await prisma.attendanceRecord.upsert({
      where: { attendanceSessionId_studentProfileId: { attendanceSessionId: demoSession.id, studentProfileId: studentProfileRecord.id } },
      update: {},
      create: {
        attendanceSessionId: demoSession.id,
        studentProfileId: studentProfileRecord.id,
        status: "present",
      },
    });
  }

  // ─── Phase 3: Assignments, Exams, Grade Scales ──────────────────────────────

  // Assignment for Math offering
  const mathAssignment = await prisma.assignment.upsert({
    where: { id: "seed-assignment-math-1" },
    update: {},
    create: {
      id: "seed-assignment-math-1",
      courseOfferingId: mathOffering.id,
      title: "Chapter 3 – Algebra Exercises",
      instructions: "Complete all questions from Exercise 3A and 3B on page 42–45. Show all working steps.",
      dueDate: new Date("2026-07-15T00:00:00Z"),
      maxScore: 50,
      isPublished: true,
    },
  });

  // Submission from Ava Patel (graded)
  if (studentProfileRecord) {
    await prisma.submission.upsert({
      where: { assignmentId_studentProfileId: { assignmentId: mathAssignment.id, studentProfileId: studentProfileRecord.id } },
      update: {},
      create: {
        assignmentId: mathAssignment.id,
        studentProfileId: studentProfileRecord.id,
        fileUrl: "https://storage.example.com/submissions/ava-ch3-algebra.pdf",
        submittedAt: new Date("2026-07-12T14:00:00Z"),
        status: "graded",
        grade: 44,
        feedback: "Excellent work! Minor arithmetic error in Q3b. Otherwise perfect.",
      },
    });
  }

  // Exam: Mid-Term Mathematics
  const midtermExam = await prisma.exam.upsert({
    where: { id: "seed-exam-math-midterm" },
    update: {},
    create: {
      id: "seed-exam-math-midterm",
      courseOfferingId: mathOffering.id,
      academicYearId: ay.id,
      title: "Mid-Term Mathematics",
      examType: "midterm",
      term: "term_1",
      weight: 1.0,
      maxMarks: 100,
      examDate: new Date("2026-08-20T09:00:00Z"),
      isPublished: true,
      publishedAt: new Date("2026-08-25T00:00:00Z"),
    },
  });

  // Exam result for Ava Patel
  if (studentProfileRecord) {
    await prisma.examResult.upsert({
      where: { examId_studentProfileId: { examId: midtermExam.id, studentProfileId: studentProfileRecord.id } },
      update: {},
      create: {
        examId: midtermExam.id,
        studentProfileId: studentProfileRecord.id,
        marksObtained: 87,
        grade: "A",
        remarks: "Very good performance. Keep it up!",
      },
    });
  }

  // Grade scale for Grade 8
  const gradeScales = [
    { gradeLabel: "A+", minPercent: 90, maxPercent: 100, gradePoint: 4.0, description: "Outstanding" },
    { gradeLabel: "A",  minPercent: 80, maxPercent: 89,  gradePoint: 3.7, description: "Excellent" },
    { gradeLabel: "B+", minPercent: 70, maxPercent: 79,  gradePoint: 3.3, description: "Very Good" },
    { gradeLabel: "B",  minPercent: 60, maxPercent: 69,  gradePoint: 3.0, description: "Good" },
    { gradeLabel: "C",  minPercent: 50, maxPercent: 59,  gradePoint: 2.0, description: "Satisfactory" },
    { gradeLabel: "D",  minPercent: 40, maxPercent: 49,  gradePoint: 1.0, description: "Pass" },
    { gradeLabel: "F",  minPercent: 0,  maxPercent: 39,  gradePoint: 0.0, description: "Fail" },
  ];
  for (const gs of gradeScales) {
    await prisma.gradeScale.upsert({
      where: { id: `seed-gs-grade8-${gs.gradeLabel.replace("+", "plus")}` },
      update: {},
      create: { id: `seed-gs-grade8-${gs.gradeLabel.replace("+", "plus")}`, gradeLevelId: grade8.id, ...gs },
    });
  }

  console.log("Seed complete. Demo accounts:");
  console.log("  admin@spira.school / Admin@1234!");
  console.log("  principal@spira.school / Principal@1234!");
  console.log("  teacher@spira.school / Teacher@1234!");
  console.log("  student: ava.patel@student.spira / Student@1234!");
  console.log("  parent@spira.school / Parent@1234!");
  console.log("  accountant@spira.school / Account@1234!");
  console.log("  counselor@spira.school / Counsel@1234!");
  console.log("  School code: spira-demo");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
