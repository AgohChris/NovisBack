import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import jwt, { JwtPayload } from 'jsonwebtoken';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'secret';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
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
    const isAdmin = payload.isAdmin || false;
    if (!userId) {
      return NextResponse.json({ message: 'Utilisateur non trouvé.' }, { status: 404 });
    }
    // Récupérer l'événement
    const event = await prisma.evennement.findUnique({ where: { id: params.id } });
    if (!event) {
      return NextResponse.json({ message: "Événement introuvable." }, { status: 404 });
    }
    // Vérifier droits (créateur ou admin)
    if (event.authorId !== userId && !isAdmin) {
      return NextResponse.json({ message: "Accès refusé. Seul le créateur ou un admin peut publier/dépublier." }, { status: 403 });
    }
    // Toggle publication
    const updated = await prisma.evennement.update({
      where: { id: params.id },
      data: { est_publie: !event.est_publie },
    });
    return NextResponse.json({ message: `Événement ${updated.est_publie ? 'publié' : 'dépublié'}.`, event: updated });
  } catch {
    return NextResponse.json({ message: 'Erreur serveur.' }, { status: 500 });
  }
} 