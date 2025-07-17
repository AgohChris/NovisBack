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
  // Récupère toutes les relations existantes ou invitations en attente
  const relations = await prisma.correspondantChat.findMany({
    where: {
      OR: [
        { inviteurId: userId },
        { inviteId: userId },
      ],
    },
    select: {
      inviteurId: true,
      inviteId: true,
    },
  });
  // Construit la liste des ids à exclure (déjà en relation ou invitation en attente)
  const exclus = new Set([userId]);
  relations.forEach(r => {
    exclus.add(r.inviteurId);
    exclus.add(r.inviteId);
  });
  // Récupère tous les utilisateurs non exclus
  const utilisateurs = await prisma.user.findMany({
    where: {
      id: { notIn: Array.from(exclus) },
    },
    select: {
      id: true,
      name: true,
      firstname: true,
      email: true,
    },
  });
  return NextResponse.json({ utilisateurs }, { status: 200 });
} 