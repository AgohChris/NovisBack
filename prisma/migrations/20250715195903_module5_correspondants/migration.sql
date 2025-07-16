-- CreateEnum
CREATE TYPE "CorrespondantStatut" AS ENUM ('en_attente', 'accepte', 'refuse');

-- CreateTable
CREATE TABLE "CorrespondantChat" (
    "id" TEXT NOT NULL,
    "inviteurId" TEXT NOT NULL,
    "inviteId" TEXT NOT NULL,
    "statut" "CorrespondantStatut" NOT NULL,
    "message" TEXT,
    "date_invitation" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "date_reponse" TIMESTAMP(3),

    CONSTRAINT "CorrespondantChat_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CorrespondantChat_inviteurId_inviteId_key" ON "CorrespondantChat"("inviteurId", "inviteId");

-- AddForeignKey
ALTER TABLE "CorrespondantChat" ADD CONSTRAINT "CorrespondantChat_inviteurId_fkey" FOREIGN KEY ("inviteurId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CorrespondantChat" ADD CONSTRAINT "CorrespondantChat_inviteId_fkey" FOREIGN KEY ("inviteId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
