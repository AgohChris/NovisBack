-- CreateEnum
CREATE TYPE "ReservationType" AS ENUM ('HEURE', 'JOURNEE', 'SEMAINE', 'MOIS');

-- CreateEnum
CREATE TYPE "ReservationStatut" AS ENUM ('EN_ATTENTE', 'CONFIRMEE', 'ANNULEE');

-- CreateTable
CREATE TABLE "Reservation" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "espaceId" TEXT NOT NULL,
    "date_debut" TIMESTAMP(3) NOT NULL,
    "date_fin" TIMESTAMP(3),
    "heure_debut" TIMESTAMP(3),
    "heure_fin" TIMESTAMP(3),
    "reservation_type" "ReservationType" NOT NULL,
    "nom_client" TEXT NOT NULL,
    "email_client" TEXT NOT NULL,
    "telephone_client" TEXT,
    "entreprise_client" TEXT,
    "demande_speciale" TEXT,
    "montant_total" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "statut" "ReservationStatut" NOT NULL DEFAULT 'EN_ATTENTE',
    "is_archived" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Reservation_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Reservation" ADD CONSTRAINT "Reservation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reservation" ADD CONSTRAINT "Reservation_espaceId_fkey" FOREIGN KEY ("espaceId") REFERENCES "Espace"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
