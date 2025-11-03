-- CreateTable
CREATE TABLE "Project" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "name" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "language" TEXT NOT NULL DEFAULT 'swedish',
    "learningObjectives" TEXT,
    "targetAudience" TEXT,
    "desiredOutcomes" TEXT,
    "constraints" TEXT,
    "particularAngle" TEXT,
    "deliverables" TEXT NOT NULL,
    "numChapters" INTEGER,
    "strictFidelity" BOOLEAN NOT NULL DEFAULT false,
    "quizQuestions" INTEGER NOT NULL DEFAULT 3
);

-- CreateTable
CREATE TABLE "SourceMaterial" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "projectId" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "filepath" TEXT NOT NULL,
    "mimetype" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    CONSTRAINT "SourceMaterial_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ProgramMatrix" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "projectId" TEXT NOT NULL,
    "overview" TEXT NOT NULL,
    "researchBasis" TEXT NOT NULL,
    "pedagogicalApproach" TEXT NOT NULL,
    "histAlignment" TEXT NOT NULL,
    "approved" BOOLEAN NOT NULL DEFAULT false,
    "approvedAt" DATETIME,
    CONSTRAINT "ProgramMatrix_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Chapter" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "projectId" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "interactiveActivity" TEXT,
    CONSTRAINT "Chapter_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "chapterId" TEXT NOT NULL,
    "number" REAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "wiifm" TEXT NOT NULL,
    CONSTRAINT "Session_chapterId_fkey" FOREIGN KEY ("chapterId") REFERENCES "Chapter" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Article" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "sessionId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "wordCount" INTEGER NOT NULL,
    "sources" TEXT,
    "status" TEXT NOT NULL,
    "histReview" TEXT,
    "factCheck" TEXT,
    "approved" BOOLEAN NOT NULL DEFAULT false,
    "approvedAt" DATETIME,
    CONSTRAINT "Article_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "VideoScript" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "sessionId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "wordCount" INTEGER NOT NULL,
    "approved" BOOLEAN NOT NULL DEFAULT false,
    "approvedAt" DATETIME,
    CONSTRAINT "VideoScript_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Quiz" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "sessionId" TEXT NOT NULL,
    "approved" BOOLEAN NOT NULL DEFAULT false,
    "approvedAt" DATETIME,
    CONSTRAINT "Quiz_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "QuizQuestion" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "quizId" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "optionA" TEXT NOT NULL,
    "optionB" TEXT NOT NULL,
    "optionC" TEXT NOT NULL,
    "correctAnswer" TEXT NOT NULL,
    CONSTRAINT "QuizQuestion_quizId_fkey" FOREIGN KEY ("quizId") REFERENCES "Quiz" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "WorkflowStep" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" DATETIME,
    "projectId" TEXT NOT NULL,
    "phase" TEXT NOT NULL,
    "step" TEXT NOT NULL,
    "agentName" TEXT,
    "status" TEXT NOT NULL,
    "result" TEXT,
    "error" TEXT,
    CONSTRAINT "WorkflowStep_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "Project_status_idx" ON "Project"("status");

-- CreateIndex
CREATE INDEX "SourceMaterial_projectId_idx" ON "SourceMaterial"("projectId");

-- CreateIndex
CREATE UNIQUE INDEX "ProgramMatrix_projectId_key" ON "ProgramMatrix"("projectId");

-- CreateIndex
CREATE INDEX "Chapter_projectId_idx" ON "Chapter"("projectId");

-- CreateIndex
CREATE UNIQUE INDEX "Chapter_projectId_number_key" ON "Chapter"("projectId", "number");

-- CreateIndex
CREATE INDEX "Session_chapterId_idx" ON "Session"("chapterId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_chapterId_number_key" ON "Session"("chapterId", "number");

-- CreateIndex
CREATE UNIQUE INDEX "Article_sessionId_key" ON "Article"("sessionId");

-- CreateIndex
CREATE UNIQUE INDEX "VideoScript_sessionId_key" ON "VideoScript"("sessionId");

-- CreateIndex
CREATE UNIQUE INDEX "Quiz_sessionId_key" ON "Quiz"("sessionId");

-- CreateIndex
CREATE INDEX "QuizQuestion_quizId_idx" ON "QuizQuestion"("quizId");

-- CreateIndex
CREATE INDEX "WorkflowStep_projectId_status_idx" ON "WorkflowStep"("projectId", "status");
