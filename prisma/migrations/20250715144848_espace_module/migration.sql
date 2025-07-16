-- CreateEnum
CREATE TYPE "EspaceType" AS ENUM ('SALLE_REUNION', 'OPEN_SPACE', 'BUREAU_PRIVE', 'ESPACE_COMMUN', 'ESPACE_EVENEMENTIEL', 'ESPACE_TOURNAGE');

-- CreateEnum
CREATE TYPE "EspaceSousType" AS ENUM ('BUREAU_CONFIANCE', 'BUREAU_DETERMINATION', 'BUREAU_SERENITE', 'BUREAU_EXCELLENCE', 'BUREAU_PROSPERITE');

-- CreateTable
CREATE TABLE "Espace" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "EspaceType" NOT NULL,
    "sous_type" "EspaceSousType",
    "description" TEXT,
    "capacite" INTEGER NOT NULL DEFAULT 1,
    "localisation" TEXT,
    "image_url" TEXT,
    "tarif_horaire" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "tarif_journalier" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "tarif_semaine" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "tarif_mensuel" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "is_available" BOOLEAN NOT NULL DEFAULT true,
    "equipement_wifi" BOOLEAN NOT NULL DEFAULT true,
    "equipement_ecran" BOOLEAN NOT NULL DEFAULT false,
    "equipement_projecteur" BOOLEAN NOT NULL DEFAULT false,
    "equipement_tableau_blanc" BOOLEAN NOT NULL DEFAULT false,
    "equipement_imprimante" BOOLEAN NOT NULL DEFAULT true,
    "equipement_climatisation" BOOLEAN NOT NULL DEFAULT false,
    "equipement_casiers" BOOLEAN NOT NULL DEFAULT false,
    "equipement_cafe" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Espace_pkey" PRIMARY KEY ("id")
);
