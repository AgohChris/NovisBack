-- CreateEnum
CREATE TYPE "BlogStatus" AS ENUM ('brouillon', 'publie');

-- CreateTable
CREATE TABLE "Blog" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "categorie" TEXT NOT NULL,
    "extrait" TEXT NOT NULL,
    "contenu" TEXT NOT NULL,
    "tags" TEXT[],
    "a_la_une" BOOLEAN NOT NULL DEFAULT false,
    "status" "BlogStatus" NOT NULL,
    "image" TEXT,
    "publier_le" TIMESTAMP(3) NOT NULL,
    "auteurId" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Blog_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Blog" ADD CONSTRAINT "Blog_auteurId_fkey" FOREIGN KEY ("auteurId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
