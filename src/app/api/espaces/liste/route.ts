import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const where: Record<string, unknown> = {};

    if (searchParams.has('type')) {
      where.type = searchParams.get('type');
    }
    if (searchParams.has('sous_type')) {
      where.sous_type = searchParams.get('sous_type');
    }
    if (searchParams.has('capacite_min')) {
      where.capacite = { gte: Number(searchParams.get('capacite_min')) };
    }
    if (searchParams.has('disponibilite')) {
      where.is_available = searchParams.get('disponibilite') === 'true';
    }
    if (searchParams.has('prix_max')) {
      // On filtre sur le tarif horaire OU journalier selon le besoin (ici horaire)
      where.tarif_horaire = { lte: Number(searchParams.get('prix_max')) };
    }

    const espaces = await prisma.espace.findMany({ where });
    return NextResponse.json({ espaces });
  } catch (error) {
    return NextResponse.json({ message: 'Erreur serveur.' }, { status: 500 });
  }
} 