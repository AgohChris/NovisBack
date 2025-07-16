import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import jwt, { JwtPayload } from 'jsonwebtoken';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'secret';

export async function GET(req: NextRequest) {
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
    // Récupérer les inscriptions de l'utilisateur
    const inscriptions = await prisma.eventRegistration.findMany({
      where: { userId },
      include: { evenement: true },
      orderBy: { date_inscription: 'desc' },
    });
    return NextResponse.json({ inscriptions });
  } catch (error) {
    return NextResponse.json({ message: 'Erreur serveur.' }, { status: 500 });
  }
} 