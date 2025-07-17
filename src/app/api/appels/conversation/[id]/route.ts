import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/authOptions';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params;
  const session = await getServerSession(authOptions);
  if (!session || !session.user?.email) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
  }
  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) {
    return NextResponse.json({ error: 'Utilisateur introuvable' }, { status: 401 });
  }
  const userId = user.id;
  // Vérifie que l'utilisateur est bien participant
  const conversation = await prisma.conversation.findUnique({ where: { id: id } });
  if (!conversation || (conversation.utilisateur1Id !== userId && conversation.utilisateur2Id !== userId)) {
    return NextResponse.json({ error: 'Accès interdit à cette conversation.' }, { status: 403 });
  }
  // Récupère l'historique des appels
  const appels = await prisma.appel.findMany({
    where: { conversationId: id },
    orderBy: { debut: 'desc' },
    select: {
      id: true,
      appelantId: true,
      debut: true,
      fin: true,
      duree: true,
      type: true,
      etat: true,
      cree_le: true,
    },
  });
  return NextResponse.json({ appels }, { status: 200 });
} 