import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/authOptions';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const invitationSchema = z.object({
  invite_id: z.string(),
  message: z.string().max(255).optional(),
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
  const parse = invitationSchema.safeParse(body);
  if (!parse.success) {
    return NextResponse.json({ error: 'Requête invalide', details: parse.error.issues }, { status: 400 });
  }
  const { invite_id, message } = parse.data;
  if (invite_id === userId) {
    return NextResponse.json({ error: 'Impossible de s’inviter soi-même.' }, { status: 400 });
  }
  // Vérifier qu’il n’existe pas déjà une invitation dans un sens ou l’autre
  const existing = await prisma.correspondantChat.findFirst({
    where: {
      OR: [
        { inviteurId: userId, inviteId: invite_id },
        { inviteurId: invite_id, inviteId: userId },
      ],
    },
  });
  if (existing) {
    return NextResponse.json({ error: 'Une invitation existe déjà entre ces utilisateurs.' }, { status: 409 });
  }
  // Créer l’invitation
  const invitation = await prisma.correspondantChat.create({
    data: {
      inviteurId: userId,
      inviteId: invite_id,
      statut: 'en_attente',
      message,
      date_invitation: new Date(),
    },
  });
  // Envoi d'un email à l'invité
  const invitedUser = await prisma.user.findUnique({ where: { id: invite_id } });
  if (invitedUser && invitedUser.email) {
    const { Resend } = await import('resend');
    const resend = new Resend(process.env.RESEND_API_KEY);
    const html = `
      <h2>Nouvelle invitation à devenir correspondant</h2>
      <p>Bonjour ${invitedUser.firstname || invitedUser.name || ''},</p>
      <p>Vous avez reçu une invitation à devenir correspondant sur NovisCoworking.</p>
      <p>Message : ${message || '(Aucun message personnalisé)'}</p>
      <p>Connectez-vous pour accepter ou refuser cette invitation.</p>
    `;
    await resend.emails.send({
      from: "NovisCoworking <noreply@noviscoworking.com>",
      to: invitedUser.email,
      subject: "Nouvelle invitation à devenir correspondant",
      html,
    });
  }
  return NextResponse.json({ success: true, invitation }, { status: 201 });
} 