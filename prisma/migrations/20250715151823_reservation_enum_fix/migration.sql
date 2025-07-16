/*
  Warnings:

  - The values [EN_ATTENTE,CONFIRMEE,ANNULEE] on the enum `ReservationStatut` will be removed. If these variants are still used in the database, this will fail.
  - The values [HEURE,JOURNEE,SEMAINE,MOIS] on the enum `ReservationType` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "ReservationStatut_new" AS ENUM ('en_attente', 'confirmee', 'annulee');
ALTER TABLE "Reservation" ALTER COLUMN "statut" DROP DEFAULT;
ALTER TABLE "Reservation" ALTER COLUMN "statut" TYPE "ReservationStatut_new" USING ("statut"::text::"ReservationStatut_new");
ALTER TYPE "ReservationStatut" RENAME TO "ReservationStatut_old";
ALTER TYPE "ReservationStatut_new" RENAME TO "ReservationStatut";
DROP TYPE "ReservationStatut_old";
ALTER TABLE "Reservation" ALTER COLUMN "statut" SET DEFAULT 'en_attente';
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "ReservationType_new" AS ENUM ('heure', 'journee', 'semaine', 'mois');
ALTER TABLE "Reservation" ALTER COLUMN "reservation_type" TYPE "ReservationType_new" USING ("reservation_type"::text::"ReservationType_new");
ALTER TYPE "ReservationType" RENAME TO "ReservationType_old";
ALTER TYPE "ReservationType_new" RENAME TO "ReservationType";
DROP TYPE "ReservationType_old";
COMMIT;

-- AlterTable
ALTER TABLE "Reservation" ALTER COLUMN "statut" SET DEFAULT 'en_attente';
