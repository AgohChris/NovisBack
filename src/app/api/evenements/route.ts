import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    // Filtres possibles
    const type = searchParams.get('type');
    const apres = searchParams.get('apres');
    const is_free = searchParams.get('is_free');
    // Construction du filtre Prisma
    const where: Record<string, unknown> = { est_publie: true };
    if (type) {
      where.type_evenement = type;
    }
    if (apres) {
      where.date = { gte: new Date(apres) };
    }
    if (is_free !== null && is_free !== undefined) {
      if (is_free === 'true') where.is_free = true;
      if (is_free === 'false') where.is_free = false;
    }
    // Récupérer les événements
    const events = await prisma.evennement.findMany({
      where,
      orderBy: { date: 'asc' },
    });
    return NextResponse.json({ events });
  } catch (error) {
    return NextResponse.json({ message: 'Erreur serveur.' }, { status: 500 });
  }
} 