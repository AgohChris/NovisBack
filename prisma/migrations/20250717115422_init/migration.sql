-- CreateEnum
CREATE TYPE "EspaceType" AS ENUM ('SALLE_REUNION', 'OPEN_SPACE', 'BUREAU_PRIVE', 'ESPACE_COMMUN', 'ESPACE_EVENEMENTIEL', 'ESPACE_TOURNAGE');

-- CreateEnum
CREATE TYPE "EspaceSousType" AS ENUM ('BUREAU_CONFIANCE', 'BUREAU_DETERMINATION', 'BUREAU_SERENITE', 'BUREAU_EXCELLENCE', 'BUREAU_PROSPERITE');

-- CreateEnum
CREATE TYPE "ReservationType" AS ENUM ('heure', 'journee', 'semaine', 'mois');

-- CreateEnum
CREATE TYPE "ReservationStatut" AS ENUM ('en_attente', 'confirmee', 'annulee');

-- CreateEnum
CREATE TYPE "TypeEvenement" AS ENUM ('Conference', 'Networking', 'Workshop', 'Social', 'Formation');

-- CreateEnum
CREATE TYPE "CorrespondantStatut" AS ENUM ('en_attente', 'accepte', 'refuse');

-- CreateEnum
CREATE TYPE "MessageType" AS ENUM ('texte', 'appel_audio', 'appel_video');

-- CreateEnum
CREATE TYPE "AppelType" AS ENUM ('audio', 'video');

-- CreateEnum
CREATE TYPE "AppelEtat" AS ENUM ('en_attente', 'accepte', 'refuse', 'termine', 'rate');

-- CreateEnum
CREATE TYPE "BlogStatus" AS ENUM ('brouillon', 'publie');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "firstname" TEXT,
    "email" TEXT,
    "password" TEXT,
    "emailVerified" TIMESTAMP(3),
    "image" TEXT,
    "role" TEXT NOT NULL DEFAULT 'user',

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "PasswordResetToken" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PasswordResetToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Espace" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "EspaceType" NOT NULL,
    "sous_type" "EspaceSousType",
    "description" TEXT,
    "capacite" INTEGER NOT NULL DEFAULT 1,
    "localisation" TEXT,
    "image" TEXT,
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

-- CreateTable
CREATE TABLE "Reservation" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "espaceId" TEXT NOT NULL,
    "date_debut" TIMESTAMP(3) NOT NULL,
    "date_fin" TIMESTAMP(3),
    "heure_debut" TEXT,
    "heure_fin" TEXT,
    "reservation_type" "ReservationType" NOT NULL,
    "nom_client" TEXT NOT NULL,
    "email_client" TEXT NOT NULL,
    "telephone_client" TEXT,
    "entreprise_client" TEXT,
    "demande_speciale" TEXT,
    "montant_total" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "statut" "ReservationStatut" NOT NULL DEFAULT 'en_attente',
    "is_archived" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Reservation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Evennement" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "type_evenement" "TypeEvenement" NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "start_time" TEXT,
    "end_time" TEXT,
    "location" TEXT NOT NULL,
    "max_participants" INTEGER NOT NULL,
    "current_participants" INTEGER NOT NULL DEFAULT 0,
    "price" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "is_free" BOOLEAN NOT NULL DEFAULT false,
    "authorId" TEXT,
    "est_publie" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Evennement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventRegistration" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "is_favorite" BOOLEAN NOT NULL DEFAULT false,
    "is_paid" BOOLEAN NOT NULL DEFAULT false,
    "registration_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "factureId" TEXT,

    CONSTRAINT "EventRegistration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EvennementFavoris" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "added_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EvennementFavoris_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GuestEventRegistration" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "prenom" TEXT NOT NULL,
    "telephone" TEXT NOT NULL,
    "adresse" TEXT NOT NULL,
    "registration_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "is_paid" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "GuestEventRegistration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Facture" (
    "id" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "montant" DOUBLE PRECISION NOT NULL,
    "statut" TEXT NOT NULL DEFAULT 'En attente',
    "fichier" TEXT,
    "reservationId" TEXT,
    "userId" TEXT,

    CONSTRAINT "Facture_pkey" PRIMARY KEY ("id")
);

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

-- CreateTable
CREATE TABLE "Conversation" (
    "id" TEXT NOT NULL,
    "utilisateur1Id" TEXT NOT NULL,
    "utilisateur2Id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Conversation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Message" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "expediteurId" TEXT NOT NULL,
    "contenu" TEXT NOT NULL,
    "horodatage" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "type" "MessageType" NOT NULL,
    "fichier" TEXT,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Appel" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "appelantId" TEXT NOT NULL,
    "date_heure" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "debut_appel" TIMESTAMP(3) NOT NULL,
    "fin_appel" TIMESTAMP(3),
    "duree" INTEGER,
    "type_appel" "AppelType" NOT NULL,
    "etat" "AppelEtat" NOT NULL,

    CONSTRAINT "Appel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Blog" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "categorie" TEXT NOT NULL,
    "extrait" TEXT NOT NULL,
    "contenu" TEXT NOT NULL,
    "tags" TEXT,
    "a_la_une" BOOLEAN NOT NULL DEFAULT false,
    "status" "BlogStatus" NOT NULL,
    "image" TEXT,
    "publier_le" TIMESTAMP(3) NOT NULL,
    "auteurId" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Blog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "titre" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "date_envoie" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");

-- CreateIndex
CREATE UNIQUE INDEX "PasswordResetToken_token_key" ON "PasswordResetToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "EventRegistration_factureId_key" ON "EventRegistration"("factureId");

-- CreateIndex
CREATE UNIQUE INDEX "Facture_reference_key" ON "Facture"("reference");

-- CreateIndex
CREATE UNIQUE INDEX "CorrespondantChat_inviteurId_inviteId_key" ON "CorrespondantChat"("inviteurId", "inviteId");

-- CreateIndex
CREATE UNIQUE INDEX "Conversation_utilisateur1Id_utilisateur2Id_key" ON "Conversation"("utilisateur1Id", "utilisateur2Id");

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PasswordResetToken" ADD CONSTRAINT "PasswordResetToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reservation" ADD CONSTRAINT "Reservation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reservation" ADD CONSTRAINT "Reservation_espaceId_fkey" FOREIGN KEY ("espaceId") REFERENCES "Espace"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Evennement" ADD CONSTRAINT "Evennement_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventRegistration" ADD CONSTRAINT "EventRegistration_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventRegistration" ADD CONSTRAINT "EventRegistration_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Evennement"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventRegistration" ADD CONSTRAINT "EventRegistration_factureId_fkey" FOREIGN KEY ("factureId") REFERENCES "Facture"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EvennementFavoris" ADD CONSTRAINT "EvennementFavoris_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EvennementFavoris" ADD CONSTRAINT "EvennementFavoris_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Evennement"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GuestEventRegistration" ADD CONSTRAINT "GuestEventRegistration_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Evennement"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Facture" ADD CONSTRAINT "Facture_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES "Reservation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Facture" ADD CONSTRAINT "Facture_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CorrespondantChat" ADD CONSTRAINT "CorrespondantChat_inviteurId_fkey" FOREIGN KEY ("inviteurId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CorrespondantChat" ADD CONSTRAINT "CorrespondantChat_inviteId_fkey" FOREIGN KEY ("inviteId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_utilisateur1Id_fkey" FOREIGN KEY ("utilisateur1Id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_utilisateur2Id_fkey" FOREIGN KEY ("utilisateur2Id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_expediteurId_fkey" FOREIGN KEY ("expediteurId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Appel" ADD CONSTRAINT "Appel_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Appel" ADD CONSTRAINT "Appel_appelantId_fkey" FOREIGN KEY ("appelantId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Blog" ADD CONSTRAINT "Blog_auteurId_fkey" FOREIGN KEY ("auteurId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
