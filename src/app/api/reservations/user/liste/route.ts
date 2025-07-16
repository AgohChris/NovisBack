import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  try {
    // Authentification avec NextAuth
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
      return NextResponse.json({ message: 'Non authentifié.' }, { status: 401 });
    }
    
    // Récupérer l'utilisateur depuis la base de données
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });
    
    if (!user) {
      return NextResponse.json({ message: 'Utilisateur non trouvé.' }, { status: 404 });
    }
    
    const userId = user.id;
    // Lister les réservations de l'utilisateur
    const reservations = await prisma.reservation.findMany({
      where: { userId },
      orderBy: { created_at: 'desc' }
    });
    return NextResponse.json({ reservations });
  } catch (error) {
    console.error('Erreur dans /api/reservations/user/liste:', error);
    return NextResponse.json({ message: 'Erreur serveur.' }, { status: 500 });
  }
} 