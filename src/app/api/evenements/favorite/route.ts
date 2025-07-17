import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import jwt, { JwtPayload } from 'jsonwebtoken';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'secret';

const favoriteSchema = z.object({
  evenement_id: z.string().min(1),
});

export async function POST(req: NextRequest) {
  try {
    // Authentification
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ message: 'Non authentifié.' }, { status: 401 });
    }
    const token = authHeader.split(' ')[1];
    let payload: JwtPayload;
    try {
      payload = jwt.verify(token, JWT_SECRET) as JwtPayload;
    } catch {
      return NextResponse.json({ message: 'Token invalide.' }, { status: 401 });
    }
    const userId = payload.id || payload.userId;
    if (!userId) {
      return NextResponse.json({ message: 'Utilisateur non trouvé.' }, { status: 404 });
    }
    // Validation du body
    const body = await req.json();
    const parse = favoriteSchema.safeParse(body);
    if (!parse.success) {
      return NextResponse.json({ message: 'Données invalides', errors: parse.error.issues }, { status: 400 });
    }
    const { evenement_id } = parse.data;
    // Vérification de l'événement
    const event = await prisma.evennement.findUnique({ where: { id: evenement_id } });
    if (!event) {
      return NextResponse.json({ message: "Événement introuvable." }, { status: 404 });
    }
    // Vérifier que le favori n'existe pas déjà
    const alreadyFavorite = await prisma.evennementFavoris.findFirst({
      where: { evenementId: evenement_id, userId },
    });
    if (alreadyFavorite) {
      return NextResponse.json({ message: "Événement déjà dans vos favoris." }, { status: 400 });
    }
    // Ajouter aux favoris
    const favori = await prisma.evennementFavoris.create({
      data: {
        evenementId: evenement_id,
        userId,
        date_ajout: new Date(),
      },
    });
    return NextResponse.json({ message: "Événement ajouté aux favoris.", favori });
  } catch {
    return NextResponse.json({ message: 'Erreur serveur.' }, { status: 500 });
  }
} 