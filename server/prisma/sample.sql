-- 1. Supervisor
CREATE TABLE "Supervisor" (
    "selfId" UUID NOT NULL DEFAULT gen_random_uuid(),
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
    "activeState" BOOLEAN NOT NULL,
    "scene" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Event_pkey" PRIMARY KEY ("selfId"),
    CONSTRAINT "Event_performanceId_fkey" FOREIGN KEY ("performanceId") REFERENCES "Performance"("selfId") ON DELETE CASCADE ON UPDATE CASCADE
);
-- Prisma автоматически создает индексы для внешних ключей
CREATE INDEX "Event_performanceId_idx" ON "Event"("performanceId");

-- 4. Registration
CREATE TABLE "Registration" (
    "selfId" UUID NOT NULL DEFAULT gen_random_uuid(),
    "eventId" UUID NOT NULL,
    "name" TEXT NOT NULL,
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
    "description" TEXT NOT NULL,
    "duration" INTEGER NOT NULL,
    "rating" TEXT NOT NULL,
    "image" TEXT NOT NULL,
    "videos" TEXT[] NOT NULL DEFAULT '{}',
    "actors" UUID[] NOT NULL DEFAULT '{}',

    CONSTRAINT "Archive_pkey" PRIMARY KEY ("selfId")
);

CREATE TABLE "Person" (
    "selfId" UUID NOT NULL DEFAULT gen_random_uuid(),
    "isActive" BOOLEAN,
    "name" TEXT NOT NULL,
    "role" TEXT,
    "image" TEXT NOT NULL,

    CONSTRAINT "Person_pkey" PRIMARY KEY ("selfId")
);