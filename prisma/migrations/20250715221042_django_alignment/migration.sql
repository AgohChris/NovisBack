/*
  Warnings:

  - You are about to drop the column `cree_le` on the `Appel` table. All the data in the column will be lost.
  - You are about to drop the column `debut` on the `Appel` table. All the data in the column will be lost.
  - You are about to drop the column `fin` on the `Appel` table. All the data in the column will be lost.
  - You are about to drop the column `type` on the `Appel` table. All the data in the column will be lost.
  - You are about to drop the column `image_url` on the `Espace` table. All the data in the column will be lost.
  - Added the required column `debut_appel` to the `Appel` table without a default value. This is not possible if the table is not empty.
  - Added the required column `type_appel` to the `Appel` table without a default value. This is not possible if the table is not empty.
  - Made the column `contenu` on table `Message` required. This step will fail if there are existing NULL values in that column.
  - Changed the type of `type` on the `Message` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "MessageType" AS ENUM ('texte', 'appel_audio', 'appel_video');

-- AlterTable
ALTER TABLE "Appel" DROP COLUMN "cree_le",
DROP COLUMN "debut",
DROP COLUMN "fin",
DROP COLUMN "type",
ADD COLUMN     "date_heure" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "debut_appel" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "fin_appel" TIMESTAMP(3),
ADD COLUMN     "type_appel" "AppelType" NOT NULL;

-- AlterTable
ALTER TABLE "Blog" ALTER COLUMN "tags" DROP NOT NULL,
ALTER COLUMN "tags" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "Espace" DROP COLUMN "image_url",
ADD COLUMN     "image" TEXT;

-- AlterTable
ALTER TABLE "Evennement" ALTER COLUMN "start_time" DROP NOT NULL,
ALTER COLUMN "start_time" SET DATA TYPE TEXT,
ALTER COLUMN "end_time" DROP NOT NULL,
ALTER COLUMN "end_time" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "Facture" ADD COLUMN     "fichier" TEXT;

-- AlterTable
ALTER TABLE "Message" ALTER COLUMN "contenu" SET NOT NULL,
DROP COLUMN "type",
ADD COLUMN     "type" "MessageType" NOT NULL;

-- AlterTable
ALTER TABLE "Reservation" ALTER COLUMN "heure_debut" SET DATA TYPE TEXT,
ALTER COLUMN "heure_fin" SET DATA TYPE TEXT;

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "titre" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "date_envoie" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
