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
  // Cherche toutes les relations acceptées où l'utilisateur est inviteur ou invité
  const correspondants = await prisma.correspondantChat.findMany({
    where: {
      statut: 'accepte',
      OR: [
        { inviteurId: userId },
        { inviteId: userId },
      ],
    },
    include: {
      inviteur: { select: { id: true, name: true, firstname: true, email: true } },
      invite:   { select: { id: true, name: true, firstname: true, email: true } },
    },
  });
  // Pour chaque relation, on retourne l'autre utilisateur
  const result = correspondants.map(c => {
    const other = c.inviteurId === userId ? c.invite : c.inviteur;
    return {
      id: c.id,
      correspondant: other,
      message: c.message,
      date_invitation: c.date_invitation,
      date_reponse: c.date_reponse,
    };
  });
  return NextResponse.json({ correspondants: result }, { status: 200 });
} 