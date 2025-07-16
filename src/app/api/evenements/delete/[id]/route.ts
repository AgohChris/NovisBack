import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import jwt, { JwtPayload } from 'jsonwebtoken';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'secret';

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
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
    const isAdmin = payload.isAdmin || false;
    if (!isAdmin) {
      return NextResponse.json({ message: 'Accès refusé. Admin uniquement.' }, { status: 403 });
    }
    // Vérifier l'existence de l'événement
    const event = await prisma.evennement.findUnique({ where: { id: params.id } });
    if (!event) {
      return NextResponse.json({ message: "Événement introuvable." }, { status: 404 });
    }
    // Soft delete : on ajoute un champ 'deleted' ou on met est_publie à false et on masque l'event
    const deleted = await prisma.evennement.update({
      where: { id: params.id },
      data: { est_publie: false },
    });
    return NextResponse.json({ message: "Événement supprimé (soft delete).", event: deleted });
  } catch (error) {
    return NextResponse.json({ message: 'Erreur serveur.' }, { status: 500 });
  }
} 