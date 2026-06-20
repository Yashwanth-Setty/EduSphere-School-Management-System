-- CreateTable
CREATE TABLE "transport_route" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "routeName" TEXT NOT NULL,
    "vehicleNumber" TEXT NOT NULL,
    "driverName" TEXT NOT NULL,
    "driverPhone" TEXT,
    "capacity" INTEGER NOT NULL DEFAULT 40,
    "status" TEXT NOT NULL DEFAULT 'on_route',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "transport_route_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transport_assignment" (
    "id" TEXT NOT NULL,
    "routeId" TEXT NOT NULL,
    "studentProfileId" TEXT NOT NULL,
    "pickupLocation" TEXT NOT NULL,
    "dropLocation" TEXT NOT NULL,
    "pickupEta" TEXT,
    "dropEta" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "transport_assignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "online_class" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "courseOfferingId" TEXT NOT NULL,
    "hostId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "durationMins" INTEGER NOT NULL DEFAULT 60,
    "meetingLink" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'upcoming',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "online_class_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "transport_assignment_routeId_studentProfileId_key" ON "transport_assignment"("routeId", "studentProfileId");

-- AddForeignKey
ALTER TABLE "transport_route" ADD CONSTRAINT "transport_route_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "school"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transport_assignment" ADD CONSTRAINT "transport_assignment_routeId_fkey" FOREIGN KEY ("routeId") REFERENCES "transport_route"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transport_assignment" ADD CONSTRAINT "transport_assignment_studentProfileId_fkey" FOREIGN KEY ("studentProfileId") REFERENCES "student_profile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "online_class" ADD CONSTRAINT "online_class_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "school"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "online_class" ADD CONSTRAINT "online_class_courseOfferingId_fkey" FOREIGN KEY ("courseOfferingId") REFERENCES "course_offering"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "online_class" ADD CONSTRAINT "online_class_hostId_fkey" FOREIGN KEY ("hostId") REFERENCES "staff_profile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
