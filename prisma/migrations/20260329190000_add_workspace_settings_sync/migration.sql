ALTER TABLE "UserSettings"
ADD COLUMN "journalThemeMode" TEXT,
ADD COLUMN "journalWritingMode" TEXT,
ADD COLUMN "journalBackgroundImage" TEXT,
ADD COLUMN "journalTemplates" JSONB,
ADD COLUMN "journalCardFields" JSONB;
