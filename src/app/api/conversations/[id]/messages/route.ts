import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/authOptions';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user?.email) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
  }
  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) {
    return NextResponse.json({ error: 'Utilisateur introuvable' }, { status: 401 });
  }
  const userId = user.id;
  const conversationId = params.id;
  // Vérifie que l'utilisateur est bien participant
  const conversation = await prisma.conversation.findUnique({ where: { id: conversationId } });
  if (!conversation || (conversation.utilisateur1Id !== userId && conversation.utilisateur2Id !== userId)) {
    return NextResponse.json({ error: 'Accès interdit à cette conversation.' }, { status: 403 });
  }
  // Pagination
  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = parseInt(searchParams.get('limit') || '30', 10);
  const skip = (page - 1) * limit;
  // Récupère les messages
  const messages = await prisma.message.findMany({
    where: { conversationId },
    orderBy: { horodatage: 'asc' },
    skip,
    take: limit,
    select: {
      id: true,
      type: true,
      contenu: true,
      expediteurId: true,
      horodatage: true,
      fichier: true,
    },
  });
  return NextResponse.json({ messages }, { status: 200 });
} 