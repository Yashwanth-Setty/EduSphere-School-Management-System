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
    where: { code: "0000" },
    update: {},
    create: {
      code: "0000",
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
    const passwordHash = await hash(password);
    return prisma.user.upsert({
      where: { schoolId_email: { schoolId: school.id, email } },
      update: { passwordHash },
      create: {
        schoolId: school.id,
        email,
        displayName,
        passwordHash: await hash(password),
        userRoles: { create: { roleId } },
      },
    });
  };

  await createUser("admin@mail.com", "SPIRA Admin", "Password@123", adminRole!.id);
  await createUser("principal@mail.com", "Dr. Meena Sharma", "Password@123", principalRole!.id);
  const teacher = await createUser("teacher@mail.com", "Raj Kumar", "Password@123", teacherRole!.id);
  await createUser("accountant@mail.com", "Priya Accounts", "Password@123", accountantRole!.id);
  await createUser("counselor@mail.com", "Sunita Counsel", "Password@123", counselorRole!.id);

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
  const studentUser = await createUser("student@mail.com", "Ava Patel", "Password@123", studentRole!.id);
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
  const parentUser = await createUser("parent@mail.com", "Anjali Patel", "Password@123", parentRole!.id);
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

  // Additional course offerings for ENG and SOC
  const engOffering = await prisma.courseOffering.upsert({
    where: { courseId_sectionId_academicTerm: { courseId: createdCourses["ENG-8"], sectionId: section.id, academicTerm: "term_1" } },
    update: {},
    create: { courseId: createdCourses["ENG-8"], sectionId: section.id, teacherId: staffProfile?.id, academicTerm: "term_1" },
  });
  const socOffering = await prisma.courseOffering.upsert({
    where: { courseId_sectionId_academicTerm: { courseId: createdCourses["SOC-8"], sectionId: section.id, academicTerm: "term_1" } },
    update: {},
    create: { courseId: createdCourses["SOC-8"], sectionId: section.id, teacherId: staffProfile?.id, academicTerm: "term_1" },
  });

  // Full-week timetable for 8-A term_1 (Mon–Fri, 6 periods/day)
  const TIMES = [
    { p: 1, start: "08:00", end: "08:45" },
    { p: 2, start: "08:50", end: "09:35" },
    { p: 3, start: "09:50", end: "10:35" },
    { p: 4, start: "10:40", end: "11:25" },
    { p: 5, start: "11:30", end: "12:15" },
    { p: 6, start: "13:00", end: "13:45" },
  ];
  // dayOfWeek: 0=Mon,1=Tue,2=Wed,3=Thu,4=Fri
  const WEEK_GRID: { day: number; period: number; offeringId: string; room: string }[] = [
    // Monday
    { day: 0, period: 1, offeringId: mathOffering.id, room: "Room 101" },
    { day: 0, period: 2, offeringId: sciOffering.id,  room: "Lab A" },
    { day: 0, period: 3, offeringId: engOffering.id,  room: "Room 203" },
    { day: 0, period: 4, offeringId: socOffering.id,  room: "Room 105" },
    { day: 0, period: 5, offeringId: mathOffering.id, room: "Room 101" },
    { day: 0, period: 6, offeringId: sciOffering.id,  room: "Lab A" },
    // Tuesday
    { day: 1, period: 1, offeringId: sciOffering.id,  room: "Lab A" },
    { day: 1, period: 2, offeringId: mathOffering.id, room: "Room 101" },
    { day: 1, period: 3, offeringId: socOffering.id,  room: "Room 105" },
    { day: 1, period: 4, offeringId: engOffering.id,  room: "Room 203" },
    { day: 1, period: 5, offeringId: sciOffering.id,  room: "Lab A" },
    { day: 1, period: 6, offeringId: mathOffering.id, room: "Room 101" },
    // Wednesday
    { day: 2, period: 1, offeringId: mathOffering.id, room: "Room 101" },
    { day: 2, period: 2, offeringId: engOffering.id,  room: "Room 203" },
    { day: 2, period: 3, offeringId: sciOffering.id,  room: "Lab A" },
    { day: 2, period: 4, offeringId: mathOffering.id, room: "Room 101" },
    { day: 2, period: 5, offeringId: socOffering.id,  room: "Room 105" },
    { day: 2, period: 6, offeringId: engOffering.id,  room: "Room 203" },
    // Thursday
    { day: 3, period: 1, offeringId: sciOffering.id,  room: "Lab A" },
    { day: 3, period: 2, offeringId: socOffering.id,  room: "Room 105" },
    { day: 3, period: 3, offeringId: mathOffering.id, room: "Room 101" },
    { day: 3, period: 4, offeringId: engOffering.id,  room: "Room 203" },
    { day: 3, period: 5, offeringId: mathOffering.id, room: "Room 101" },
    { day: 3, period: 6, offeringId: sciOffering.id,  room: "Lab A" },
    // Friday
    { day: 4, period: 1, offeringId: mathOffering.id, room: "Room 101" },
    { day: 4, period: 2, offeringId: sciOffering.id,  room: "Lab A" },
    { day: 4, period: 3, offeringId: socOffering.id,  room: "Room 105" },
    { day: 4, period: 4, offeringId: engOffering.id,  room: "Room 203" },
    { day: 4, period: 5, offeringId: sciOffering.id,  room: "Lab A" },
    { day: 4, period: 6, offeringId: mathOffering.id, room: "Room 101" },
  ];
  const slots = WEEK_GRID.map((g) => {
    const t = TIMES.find((x) => x.p === g.period)!;
    return { dayOfWeek: g.day, periodNumber: g.period, startTime: t.start, endTime: t.end, courseOfferingId: g.offeringId, roomLabel: g.room };
  });

  for (const slot of slots) {
    await prisma.timetableSlot.upsert({
      where: { sectionId_dayOfWeek_periodNumber_term: { sectionId: section.id, dayOfWeek: slot.dayOfWeek, periodNumber: slot.periodNumber, term: "term_1" } },
      update: {},
      create: { sectionId: section.id, term: "term_1", ...slot },
    });
  }

  // 30-day attendance history (~90% attendance rate)
  const studentProfileRecord = await prisma.studentProfile.findFirst({ where: { userId: studentUser.id } });
  // Generate school days for last 30 calendar days (Mon–Fri only)
  const attendanceDays: Date[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date("2026-06-20T00:00:00Z");
    d.setUTCDate(d.getUTCDate() - i);
    const dow = d.getUTCDay(); // 0=Sun, 6=Sat
    if (dow !== 0 && dow !== 6) attendanceDays.push(d);
  }
  // Mark ~10% absent (every 10th day)
  for (let idx = 0; idx < attendanceDays.length; idx++) {
    const day = attendanceDays[idx];
    const isAbsent = idx % 10 === 9;
    const session = await prisma.attendanceSession.upsert({
      where: { sectionId_sessionDate_periodNumber: { sectionId: section.id, sessionDate: day, periodNumber: 1 } },
      update: {},
      create: {
        schoolId: school.id, sectionId: section.id, teacherId: staffProfile?.id,
        sessionDate: day, periodNumber: 1, submittedAt: new Date(day.getTime() + 45 * 60000),
      },
    });
    if (studentProfileRecord) {
      await prisma.attendanceRecord.upsert({
        where: { attendanceSessionId_studentProfileId: { attendanceSessionId: session.id, studentProfileId: studentProfileRecord.id } },
        update: {},
        create: { attendanceSessionId: session.id, studentProfileId: studentProfileRecord.id, status: isAbsent ? "absent" : "present" },
      });
    }
  }

  // ─── Phase 3: Assignments, Exams, Grade Scales ──────────────────────────────

  // Assignments — mix of graded, submitted-pending-grade, and due-upcoming
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

  // Assignment 2 — Science, submitted, awaiting grade
  const sciAssignment = await prisma.assignment.upsert({
    where: { id: "seed-assignment-sci-1" },
    update: {},
    create: {
      id: "seed-assignment-sci-1",
      courseOfferingId: sciOffering.id,
      title: "Lab Report – Refraction Experiment",
      instructions: "Write a full lab report for the refraction of light experiment conducted on June 12. Include aim, materials, procedure, observations and conclusion.",
      dueDate: new Date("2026-06-28T00:00:00Z"),
      maxScore: 30,
      isPublished: true,
    },
  });
  if (studentProfileRecord) {
    await prisma.submission.upsert({
      where: { assignmentId_studentProfileId: { assignmentId: sciAssignment.id, studentProfileId: studentProfileRecord.id } },
      update: {},
      create: {
        assignmentId: sciAssignment.id,
        studentProfileId: studentProfileRecord.id,
        fileUrl: "https://storage.example.com/submissions/ava-refraction-lab.pdf",
        submittedAt: new Date("2026-06-25T10:00:00Z"),
        status: "submitted",
      },
    });
  }

  // Assignment 3 — English, pending (not yet submitted)
  await prisma.assignment.upsert({
    where: { id: "seed-assignment-eng-1" },
    update: {},
    create: {
      id: "seed-assignment-eng-1",
      courseOfferingId: engOffering.id,
      title: "Essay – My Favourite Book",
      instructions: "Write a 500-word essay about your favourite book. Explain why you love it and what you learnt from it.",
      dueDate: new Date("2026-07-05T00:00:00Z"),
      maxScore: 25,
      isPublished: true,
    },
  });

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

  // Exam 2 — Science Mid-Term (upcoming, not yet published)
  const sciExam = await prisma.exam.upsert({
    where: { id: "seed-exam-sci-midterm" },
    update: {},
    create: {
      id: "seed-exam-sci-midterm",
      courseOfferingId: sciOffering.id,
      academicYearId: ay.id,
      title: "Mid-Term Science",
      examType: "midterm",
      term: "term_1",
      weight: 1.0,
      maxMarks: 100,
      examDate: new Date("2026-08-22T09:00:00Z"),
      isPublished: false,
    },
  });
  void sciExam; // referenced in transport/online class section later

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

  // ─── Phase 4: Fee Plans, Invoices, Payments ────────────────────────────────

  const termPlan = await prisma.feePlan.upsert({
    where: { id: "seed-feeplan-term1" },
    update: {},
    create: {
      id: "seed-feeplan-term1",
      schoolId: school.id,
      name: "Term 1 Tuition Fee",
      description: "Standard term 1 tuition fee for Grade 8",
      amount: 15000,
      currency: "INR",
      isActive: true,
    },
  });

  const activityPlan = await prisma.feePlan.upsert({
    where: { id: "seed-feeplan-activity" },
    update: {},
    create: {
      id: "seed-feeplan-activity",
      schoolId: school.id,
      name: "Activity & Lab Fee",
      description: "Annual activity, sports and lab fee",
      amount: 3500,
      currency: "INR",
      isActive: true,
    },
  });

  if (studentProfileRecord) {
    // Invoice 1 — paid
    const inv1 = await prisma.feeInvoice.upsert({
      where: { invoiceNo: "INV-SEED-2026-0001" },
      update: {},
      create: {
        feePlanId: termPlan.id,
        studentProfileId: studentProfileRecord.id,
        invoiceNo: "INV-SEED-2026-0001",
        amountDue: 15000,
        amountPaid: 15000,
        dueDate: new Date("2026-07-15T00:00:00Z"),
        status: "paid",
        issuedAt: new Date("2026-06-01T00:00:00Z"),
      },
    });

    await prisma.payment.upsert({
      where: { id: "seed-payment-1" },
      update: {},
      create: {
        id: "seed-payment-1",
        feeInvoiceId: inv1.id,
        amount: 15000,
        method: "bank_transfer",
        referenceNo: "NEFT/2026/06/001",
        status: "completed",
        paidAt: new Date("2026-06-10T10:00:00Z"),
      },
    });

    // Invoice 2 — partial payment
    const inv2 = await prisma.feeInvoice.upsert({
      where: { invoiceNo: "INV-SEED-2026-0002" },
      update: {},
      create: {
        feePlanId: activityPlan.id,
        studentProfileId: studentProfileRecord.id,
        invoiceNo: "INV-SEED-2026-0002",
        amountDue: 3500,
        amountPaid: 2000,
        dueDate: new Date("2026-07-31T00:00:00Z"),
        status: "partial",
        issuedAt: new Date("2026-06-05T00:00:00Z"),
      },
    });

    await prisma.payment.upsert({
      where: { id: "seed-payment-2" },
      update: {},
      create: {
        id: "seed-payment-2",
        feeInvoiceId: inv2.id,
        amount: 2000,
        method: "cash",
        referenceNo: "CASH-001",
        status: "completed",
        paidAt: new Date("2026-06-20T11:30:00Z"),
      },
    });
  }

  // ─── Phase 5: Documents & Announcements ────────────────────────────────────

  const adminUser = await prisma.user.findUnique({ where: { schoolId_email: { schoolId: school.id, email: "admin@mail.com" } } });

  if (adminUser) {
    // Documents — textbooks, notes, circulars, report cards
    const docs = [
      { id: "seed-doc-policy", category: "policy", title: "Student Code of Conduct 2026-27", storageKey: "docs/policy/code-of-conduct-2026.pdf", mimeType: "application/pdf", sizeBytes: 245760, visibilityScope: "school_admin", tags: ["policy", "conduct"] },
      { id: "seed-doc-circular", category: "circular", title: "Term 1 Academic Calendar", storageKey: "docs/circulars/academic-calendar-t1.pdf", mimeType: "application/pdf", sizeBytes: 102400, visibilityScope: "student", tags: ["calendar", "term1"] },
      { id: "seed-doc-section", category: "circular", title: "Grade 8-A Timetable Revision", storageKey: "docs/section/8a-timetable-rev1.pdf", mimeType: "application/pdf", sizeBytes: 51200, visibilityScope: "section", tags: ["timetable"] },
      { id: "seed-doc-finance", category: "finance", title: "Fee Collection Report June 2026", storageKey: "docs/finance/fee-report-jun-2026.xlsx", mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", sizeBytes: 81920, visibilityScope: "finance", tags: ["finance"] },
      { id: "seed-doc-counselor", category: "counselor", title: "Student Wellbeing Guidelines", storageKey: "docs/counselor/wellbeing-guide.pdf", mimeType: "application/pdf", sizeBytes: 163840, visibilityScope: "counselor", tags: ["wellbeing"] },
      { id: "seed-doc-report", category: "report_card", title: "Ava Patel – Term 1 Report Card", storageKey: "docs/reports/ava-patel-t1-2026.pdf", mimeType: "application/pdf", sizeBytes: 92160, visibilityScope: "student", tags: ["report", "results"] },
      // Textbooks
      { id: "seed-doc-math-tb", category: "textbook", title: "Mathematics Grade 8 – NCERT Textbook", storageKey: "docs/textbooks/math-grade8-ncert.pdf", mimeType: "application/pdf", sizeBytes: 5242880, visibilityScope: "student", tags: ["textbook", "math", "grade8"] },
      { id: "seed-doc-sci-tb", category: "textbook", title: "Science Grade 8 – NCERT Textbook", storageKey: "docs/textbooks/science-grade8-ncert.pdf", mimeType: "application/pdf", sizeBytes: 6291456, visibilityScope: "student", tags: ["textbook", "science", "grade8"] },
      { id: "seed-doc-eng-tb", category: "textbook", title: "English Honeydew Grade 8 – NCERT", storageKey: "docs/textbooks/english-honeydew-grade8.pdf", mimeType: "application/pdf", sizeBytes: 4194304, visibilityScope: "student", tags: ["textbook", "english", "grade8"] },
      { id: "seed-doc-soc-tb", category: "textbook", title: "Social Studies Grade 8 – NCERT", storageKey: "docs/textbooks/social-grade8-ncert.pdf", mimeType: "application/pdf", sizeBytes: 4718592, visibilityScope: "student", tags: ["textbook", "social", "grade8"] },
      // Notes
      { id: "seed-doc-math-notes", category: "notes", title: "Mathematics – Algebra Quick Notes", storageKey: "docs/notes/math-algebra-quick-notes.pdf", mimeType: "application/pdf", sizeBytes: 512000, visibilityScope: "student", tags: ["notes", "math", "algebra"] },
      { id: "seed-doc-sci-notes", category: "notes", title: "Science – Light & Optics Summary", storageKey: "docs/notes/science-optics-summary.pdf", mimeType: "application/pdf", sizeBytes: 409600, visibilityScope: "student", tags: ["notes", "science", "optics"] },
      { id: "seed-doc-eng-notes", category: "notes", title: "English – Essay Writing Tips", storageKey: "docs/notes/english-essay-tips.pdf", mimeType: "application/pdf", sizeBytes: 307200, visibilityScope: "student", tags: ["notes", "english", "writing"] },
      // Question papers
      { id: "seed-doc-math-qp", category: "question_paper", title: "Mathematics – Previous Year Question Paper 2025", storageKey: "docs/qpapers/math-grade8-2025.pdf", mimeType: "application/pdf", sizeBytes: 358400, visibilityScope: "student", tags: ["question_paper", "math", "2025"] },
      { id: "seed-doc-sci-qp", category: "question_paper", title: "Science – Previous Year Question Paper 2025", storageKey: "docs/qpapers/science-grade8-2025.pdf", mimeType: "application/pdf", sizeBytes: 327680, visibilityScope: "student", tags: ["question_paper", "science", "2025"] },
    ];
    for (const d of docs) {
      const { tags, ...docData } = d;
      await prisma.document.upsert({
        where: { id: d.id },
        update: {},
        create: { ...docData, schoolId: school.id, uploadedById: adminUser.id, tags: tags ?? [] },
      });
    }

    // Announcements — school-wide + group channels
    const announcements = [
      {
        id: "seed-ann-school",
        title: "Welcome to the 2026-27 Academic Year!",
        body: "We are delighted to welcome all students, staff and parents to the new academic year. Please review the updated code of conduct and academic calendar shared in the Documents section.",
        audienceScope: "school",
        channel: "in_app",
        isPublished: true,
        publishedAt: new Date("2026-06-01T08:00:00Z"),
      },
      {
        id: "seed-ann-students",
        title: "Term 1 Exam Schedule Released",
        body: "The Term 1 mid-term examination schedule has been published. Students are advised to check their exam timetable and prepare accordingly. Best of luck!",
        audienceScope: "students",
        channel: "in_app",
        isPublished: true,
        publishedAt: new Date("2026-06-10T09:00:00Z"),
      },
      {
        id: "seed-ann-parents",
        title: "Parent-Teacher Meeting – 5 July 2026",
        body: "We invite all parents to attend the Parent-Teacher Meeting scheduled for Saturday, 5 July 2026 from 9:00 AM to 1:00 PM. Slot bookings will open on the portal shortly.",
        audienceScope: "parents",
        channel: "in_app",
        isPublished: true,
        publishedAt: new Date("2026-06-15T10:00:00Z"),
      },
      {
        id: "seed-ann-teachers",
        title: "Staff Development Workshop – 28 June",
        body: "All teaching staff are required to attend the professional development workshop on 28 June 2026. Agenda will be shared via email. Please confirm attendance by 22 June.",
        audienceScope: "teachers",
        channel: "in_app",
        isPublished: true,
        publishedAt: new Date("2026-06-18T08:30:00Z"),
      },
      // Class group
      {
        id: "seed-ann-class-1",
        title: "Grade 8-A: Assignment Submission Reminder",
        body: "Dear 8-A students, please remember that the Science Lab Report is due on 28 June. Submit your work via the Assignments section before 11:59 PM.",
        audienceScope: "students",
        channel: "in_app",
        isPublished: true,
        publishedAt: new Date("2026-06-20T07:00:00Z"),
      },
      {
        id: "seed-ann-class-2",
        title: "Grade 8-A: Maths Extra Class on Saturday",
        body: "An extra revision class for Grade 8-A Mathematics will be held on Saturday, 27 June from 10:00 AM to 12:00 PM in Room 101. Attendance is strongly recommended.",
        audienceScope: "students",
        channel: "in_app",
        isPublished: true,
        publishedAt: new Date("2026-06-19T14:00:00Z"),
      },
      // Sports group
      {
        id: "seed-ann-sports-1",
        title: "Inter-School Cricket Tournament – Team Selection",
        body: "Trials for the inter-school cricket tournament will be held on the school grounds on 25 June at 3:30 PM. All interested Grade 7 & 8 students are welcome to participate.",
        audienceScope: "students",
        channel: "in_app",
        isPublished: true,
        publishedAt: new Date("2026-06-18T12:00:00Z"),
      },
      {
        id: "seed-ann-sports-2",
        title: "Annual Sports Day – 15 August 2026",
        body: "Mark your calendars! Annual Sports Day is scheduled for 15 August 2026. Events include 100m sprint, long jump, relay race, and tug-of-war. Registrations open from 1 July.",
        audienceScope: "school",
        channel: "in_app",
        isPublished: true,
        publishedAt: new Date("2026-06-17T09:00:00Z"),
      },
      // Science club
      {
        id: "seed-ann-sci-club",
        title: "Science Club: Robotics Workshop Next Week",
        body: "SPIRA Science Club is hosting a Robotics & AI workshop on 26 June from 2:00 PM to 5:00 PM in Lab A. Limited seats — register with your Science teacher by 23 June.",
        audienceScope: "students",
        channel: "in_app",
        isPublished: true,
        publishedAt: new Date("2026-06-19T10:00:00Z"),
      },
      {
        id: "seed-ann-draft",
        title: "Upcoming Cultural Fest – Planning Draft",
        body: "Cultural Fest tentatively planned for October 2026. Coordinators to share event list by end of July.",
        audienceScope: "school",
        channel: "in_app",
        isPublished: false,
        publishedAt: null,
      },
    ];
    for (const a of announcements) {
      await prisma.announcement.upsert({
        where: { id: a.id },
        update: {},
        create: { ...a, schoolId: school.id, authorId: adminUser.id },
      });
    }
  }

  // ─── Phase 9: Transport Routes ─────────────────────────────────────────────
  const route1 = await prisma.transportRoute.upsert({
    where: { id: "seed-route-1" },
    update: {},
    create: {
      id: "seed-route-1",
      schoolId: school.id,
      routeName: "Route A – North Zone",
      vehicleNumber: "MH-12-AB-1234",
      driverName: "Ramesh Yadav",
      driverPhone: "+91-98765-43210",
      capacity: 42,
      status: "on_route",
    },
  });
  await prisma.transportRoute.upsert({
    where: { id: "seed-route-2" },
    update: {},
    create: {
      id: "seed-route-2",
      schoolId: school.id,
      routeName: "Route B – South Zone",
      vehicleNumber: "MH-12-CD-5678",
      driverName: "Suresh Patil",
      driverPhone: "+91-87654-32109",
      capacity: 38,
      status: "arrived",
    },
  });

  // Assign Ava Patel to Route A
  if (studentProfileRecord) {
    await prisma.transportAssignment.upsert({
      where: { routeId_studentProfileId: { routeId: route1.id, studentProfileId: studentProfileRecord.id } },
      update: {},
      create: {
        routeId: route1.id,
        studentProfileId: studentProfileRecord.id,
        pickupLocation: "Sunrise Apartments, Sector 12",
        dropLocation: "SPIRA Demo School – Main Gate",
        pickupEta: "07:30",
        dropEta: "16:00",
      },
    });
  }

  // ─── Phase 9: Online Classes ───────────────────────────────────────────────
  await prisma.onlineClass.upsert({
    where: { id: "seed-oc-math-1" },
    update: {},
    create: {
      id: "seed-oc-math-1",
      schoolId: school.id,
      courseOfferingId: mathOffering.id,
      hostId: staffProfile!.id,
      title: "Algebra Revision – Quadratic Equations",
      scheduledAt: new Date("2026-06-21T10:00:00Z"),
      durationMins: 60,
      meetingLink: "https://meet.google.com/abc-defg-hij",
      status: "upcoming",
    },
  });
  await prisma.onlineClass.upsert({
    where: { id: "seed-oc-sci-1" },
    update: {},
    create: {
      id: "seed-oc-sci-1",
      schoolId: school.id,
      courseOfferingId: sciOffering.id,
      hostId: staffProfile!.id,
      title: "Light & Optics – Live Demo",
      scheduledAt: new Date("2026-06-19T11:00:00Z"),
      durationMins: 45,
      meetingLink: "https://meet.google.com/xyz-uvwx-yz1",
      status: "completed",
    },
  });
  await prisma.onlineClass.upsert({
    where: { id: "seed-oc-eng-1" },
    update: {},
    create: {
      id: "seed-oc-eng-1",
      schoolId: school.id,
      courseOfferingId: engOffering.id,
      hostId: staffProfile!.id,
      title: "Essay Writing Workshop",
      scheduledAt: new Date("2026-06-23T09:00:00Z"),
      durationMins: 90,
      meetingLink: "https://meet.google.com/eng-writ-sho",
      status: "upcoming",
    },
  });

  console.log("Seed complete. Demo accounts (school code: 0000 / password: Password@123):");
  console.log("  admin@mail.com");
  console.log("  student@mail.com");
  console.log("  parent@mail.com");
  console.log("  (also: principal@mail.com, teacher@mail.com, accountant@mail.com, counselor@mail.com)");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
