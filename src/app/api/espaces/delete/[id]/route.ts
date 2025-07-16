import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    await prisma.espace.delete({ where: { id } });
    return NextResponse.json({ message: 'Espace supprimé avec succès.' });
  } catch (error) {
    return NextResponse.json({ message: 'Erreur serveur ou espace introuvable.' }, { status: 500 });
  }
} 