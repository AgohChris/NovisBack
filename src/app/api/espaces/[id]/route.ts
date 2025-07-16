import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const espace = await prisma.espace.findUnique({ where: { id } });
    if (!espace) {
      return NextResponse.json({ message: 'Espace non trouvé.' }, { status: 404 });
    }
    return NextResponse.json({ espace });
  } catch (error) {
    return NextResponse.json({ message: 'Erreur serveur.' }, { status: 500 });
  }
} 