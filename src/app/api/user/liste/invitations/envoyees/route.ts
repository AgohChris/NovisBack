import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/authOptions';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || !session.user?.email) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
  }
  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) {
    return NextResponse.json({ error: 'Utilisateur introuvable' }, { status: 401 });
  }
  const userId = user.id;
  // Cherche toutes les invitations envoyées en attente
  const invitations = await prisma.correspondantChat.findMany({
    where: {
      statut: 'en_attente',
      inviteurId: userId,
    },
    include: {
      invite: { select: { id: true, name: true, firstname: true, email: true } },
    },
  });
  const result = invitations.map(inv => ({
    id: inv.id,
    invite: inv.invite,
    message: inv.message,
    date_invitation: inv.date_invitation,
  }));
  return NextResponse.json({ invitations: result }, { status: 200 });
} 