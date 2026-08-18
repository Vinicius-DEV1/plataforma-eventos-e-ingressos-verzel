-- CreateTable
CREATE TABLE "Category" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Category_name_key" ON "Category"("name");

-- AlterTable
ALTER TABLE "Event" ADD COLUMN "categoryId" TEXT;

-- Backfill: um registro de Category para cada valor distinto que já existe
-- em Event.category (texto livre até aqui), e o evento passa a referenciar
-- essa categoria pelo id. gen_random_uuid() é nativo a partir do Postgres 13
-- (o projeto roda 17), sem depender da extensão pgcrypto.
INSERT INTO "Category" ("id", "name")
SELECT gen_random_uuid()::text, DISTINCT_CATEGORY."category"
FROM (SELECT DISTINCT "category" FROM "Event") AS DISTINCT_CATEGORY;

UPDATE "Event"
SET "categoryId" = "Category"."id"
FROM "Category"
WHERE "Category"."name" = "Event"."category";

-- AlterTable
ALTER TABLE "Event" DROP COLUMN "category";

-- CreateIndex
CREATE INDEX "Event_categoryId_idx" ON "Event"("categoryId");

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;
