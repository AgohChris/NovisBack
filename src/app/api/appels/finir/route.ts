import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const finirSchema = z.object({
  appel_id: z.string(),
  etat_final: z.enum(['termine', 'rate', 'refuse', 'accepte']),
  fin: z.string().datetime(),
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
  const parse = finirSchema.safeParse(body);
  if (!parse.success) {
    return NextResponse.json({ error: 'Requête invalide', details: parse.error.issues }, { status: 400 });
  }
  const { appel_id, etat_final, fin } = parse.data;
  const appel = await prisma.appel.findUnique({
    where: { id: appel_id },
    include: { conversation: true },
  });
  if (!appel) {
    return NextResponse.json({ error: 'Appel introuvable' }, { status: 404 });
  }
  // Vérifie que l'utilisateur est participant à la conversation
  if (appel.conversation.utilisateur1Id !== userId && appel.conversation.utilisateur2Id !== userId) {
    return NextResponse.json({ error: 'Accès interdit à cet appel.' }, { status: 403 });
  }
  // Calcule la durée si possible
  let duree = null;
  if (appel.debut && fin) {
    duree = Math.max(0, Math.floor((new Date(fin).getTime() - new Date(appel.debut).getTime()) / 1000));
  }
  const updated = await prisma.appel.update({
    where: { id: appel_id },
    data: {
      etat: etat_final,
      fin: new Date(fin),
      duree,
    },
  });
  return NextResponse.json({ success: true, appel: updated }, { status: 200 });
} 