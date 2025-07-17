import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/authOptions';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const appelSchema = z.object({
  conversation_id: z.string(),
});

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user?.email) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
  }
  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) {
    return NextResponse.json({ error: 'Utilisateur introuvable' }, { status: 401 });
  }
  const userId = user.id;
  const body = await req.json();
  const parse = appelSchema.safeParse(body);
  if (!parse.success) {
    return NextResponse.json({ error: 'Requête invalide', details: parse.error.issues }, { status: 400 });
  }
  const { conversation_id } = parse.data;
  // Vérifie que l'utilisateur est bien participant à la conversation
  const conversation = await prisma.conversation.findUnique({ where: { id: conversation_id } });
  if (!conversation || (conversation.utilisateur1Id !== userId && conversation.utilisateur2Id !== userId)) {
    return NextResponse.json({ error: 'Accès interdit à cette conversation.' }, { status: 403 });
  }
  // Vérifie qu'il n'y a pas déjà un appel actif dans cette conversation
  const appelActif = await prisma.appel.findFirst({
    where: {
      conversationId: conversation_id,
      etat: { in: ['en_attente', 'accepte'] },
    },
  });
  if (appelActif) {
    return NextResponse.json({ error: 'Un appel est déjà en cours dans cette conversation.' }, { status: 409 });
  }
  // Crée l'appel vidéo
  const appel = await prisma.appel.create({
    data: {
      conversationId: conversation_id,
      appelantId: userId,
      debut: new Date(),
      type: 'video',
      etat: 'en_attente',
      cree_le: new Date(),
    },
  });
  return NextResponse.json({ success: true, appel }, { status: 201 });
} 