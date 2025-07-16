import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  try {
    // Authentification avec NextAuth
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ message: 'Non authentifié.' }, { status: 401 });
    }
    const userId = (session.user as any).id;
    if (!userId) {
      return NextResponse.json({ message: 'Utilisateur non trouvé.' }, { status: 404 });
    }
    // Lister les réservations de l'utilisateur
    const reservations = await prisma.reservation.findMany({
      where: { userId },
      orderBy: { created_at: 'desc' }
    });
    return NextResponse.json({ reservations });
  } catch (error) {
    return NextResponse.json({ message: 'Erreur serveur.' }, { status: 500 });
  }
} 