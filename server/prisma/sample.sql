-- 1. Supervisor
CREATE TABLE "Supervisor" (
    "selfId" UUID NOT NULL DEFAULT gen_random_uuid(),
    "orderNo" SERIAL,
    "name" TEXT NOT NULL,
    "role" TEXT,
    "contactInfo" TEXT,
    "image" TEXT,

    CONSTRAINT "Supervisor_pkey" PRIMARY KEY ("selfId"),
    CONSTRAINT "Supervisor_name_key" UNIQUE ("name")
);

-- 2. Performance
CREATE TABLE "Performance" (
    "selfId" UUID NOT NULL DEFAULT gen_random_uuid(),
    "title" TEXT NOT NULL,
    "genre" TEXT,
    "director" TEXT,
    "description" TEXT,
    "duration" INTEGER NOT NULL,
    "rating" TEXT NOT NULL,
    "image" TEXT NOT NULL,

    CONSTRAINT "Performance_pkey" PRIMARY KEY ("selfId")
);

-- 3. Event
CREATE TABLE "Event" (
    "selfId" UUID NOT NULL DEFAULT gen_random_uuid(),
    "performanceId" UUID NOT NULL,
    "activeState" BOOLEAN DEFAULT TRUE NOT NULL,
    "scene" TEXT NOT NULL,
    "date" TIMESTAMP(0) NOT NULL,

    CONSTRAINT "Event_pkey" PRIMARY KEY ("selfId"),
    CONSTRAINT "Event_performanceId_fkey" FOREIGN KEY ("performanceId") REFERENCES "Performance"("selfId") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "Event_performanceId_idx" ON "Event"("performanceId");

-- 4. Registration
CREATE TABLE "Registration" (
    "selfId" UUID NOT NULL DEFAULT gen_random_uuid(),
    "eventId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "surname" TEXT NOT NULL,
    "middleName" TEXT,
    "email" TEXT,
    "phoneNumber" TEXT,

    CONSTRAINT "Registration_pkey" PRIMARY KEY ("selfId"),
    CONSTRAINT "Registration_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("selfId") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "Registration_eventId_idx" ON "Registration"("eventId");

-- 5. Archive
CREATE TABLE "Archive" (
    "selfId" UUID NOT NULL DEFAULT gen_random_uuid(),
    "title" TEXT NOT NULL,
    "genre" TEXT,
    "director" TEXT,
    "description" TEXT,
    "duration" INTEGER NOT NULL,
    "rating" TEXT NOT NULL,
    "image" TEXT NOT NULL,
    "mainPhoto" TEXT,
    "dates" TIMESTAMP(0) NOT NULL DEFAULT '{}'
    "videos" TEXT[] NOT NULL DEFAULT '{}',
    "photos" TEXT[] NOT NULL DEFAULT '{}',

    CONSTRAINT "Archive_pkey" PRIMARY KEY ("selfId")
);

-- 6. Person
CREATE TABLE "Person" (
    "selfId" UUID NOT NULL DEFAULT gen_random_uuid(),
    "orderNo" SERIAL,
    "contactInfo" TEXT,
    "isActive" BOOLEAN DEFAULT TRUE NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT,
    "image" TEXT NOT NULL,

    CONSTRAINT "Person_pkey" PRIMARY KEY ("selfId")
);

-- 7. ArchiveActor
CREATE TABLE "ArchiveActor" (
    "archiveId" UUID NOT NULL,
    "personId" UUID NOT NULL,

    CONSTRAINT "ArchiveActor_pkey" PRIMARY KEY ("archiveId", "personId"),
    CONSTRAINT "ArchiveActor_archiveId_fkey" FOREIGN KEY ("archiveId") REFERENCES "Archive"("selfId") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ArchiveActor_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person"("selfId") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "ArchiveActor_personId_idx" ON "ArchiveActor"("personId");

-- 8. ArchiveEvent
CREATE TABLE "ArchiveEvent" (
    "selfId" UUID NOT NULL DEFAULT gen_random_uuid(),
    "archiveId" UUID NOT NULL,
    "scene" TEXT NOT NULL,
    "date" TIMESTAMP(0) NOT NULL,

    CONSTRAINT "ArchiveEvent" PRIMARY KEY ("selfId"),
    CONSTRAINT "ArchiveEvent_archiveId_fkey" FOREIGN KEY ("performanceId") REFERENCES "Performance"("selfId") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "ArchiveEvent_archiveId_idx" ON "Event"("performanceId");