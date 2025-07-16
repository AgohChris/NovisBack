-- CreateEnum
CREATE TYPE "AppelType" AS ENUM ('audio', 'video');

-- CreateEnum
CREATE TYPE "AppelEtat" AS ENUM ('en_attente', 'accepte', 'refuse', 'termine', 'rate');

-- CreateTable
CREATE TABLE "Appel" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "appelantId" TEXT NOT NULL,
    "debut" TIMESTAMP(3) NOT NULL,
    "fin" TIMESTAMP(3),
    "duree" INTEGER,
    "type" "AppelType" NOT NULL,
    "etat" "AppelEtat" NOT NULL,
    "cree_le" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Appel_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Appel" ADD CONSTRAINT "Appel_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Appel" ADD CONSTRAINT "Appel_appelantId_fkey" FOREIGN KEY ("appelantId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
