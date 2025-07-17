import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import jwt, { JwtPayload } from 'jsonwebtoken';
import type { Prisma, ReservationStatut } from '@prisma/client';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'secret';

export async function GET(req: NextRequest) {
  try {
    // Authentification (admin à gérer plus tard)
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
    // Filtres
    const { searchParams } = new URL(req.url);
    const where: Prisma.ReservationWhereInput = {};
    if (searchParams.has('statut')) {
      const statut = searchParams.get('statut');
      where.statut = (statut !== null ? statut : undefined) as ReservationStatut | undefined;
    }
    if (searchParams.has('espace_id')) {
      const espaceId = searchParams.get('espace_id');
      where.espaceId = espaceId !== null ? espaceId : undefined;
    }
    if (searchParams.has('mois') && searchParams.has('annee')) {
      const mois = Number(searchParams.get('mois'));
      const annee = Number(searchParams.get('annee'));
      where.date_debut = {
        gte: new Date(annee, mois - 1, 1),
        lt: new Date(annee, mois, 1)
      };
    }
    const reservations = await prisma.reservation.findMany({
      where,
      orderBy: { created_at: 'desc' }
    });
    return NextResponse.json({ reservations });
  } catch {
    return NextResponse.json({ message: 'Erreur serveur.' }, { status: 500 });
  }
} 