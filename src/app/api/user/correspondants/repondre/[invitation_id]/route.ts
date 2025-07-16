import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const reponseSchema = z.object({
  statut: z.enum(['accepte', 'refuse']),
});

export async function POST(req: Request, { params }: { params: { invitation_id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user?.email) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
  }
  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) {
    return NextResponse.json({ error: 'Utilisateur introuvable' }, { status: 401 });
  }
  const userId = user.id;
  const { invitation_id } = params;
  const invitation = await prisma.correspondantChat.findUnique({ where: { id: invitation_id } });
  if (!invitation) {
    return NextResponse.json({ error: 'Invitation introuvable' }, { status: 404 });
  }
  if (invitation.inviteId !== userId) {
    return NextResponse.json({ error: 'Accès interdit : vous n’êtes pas l’invité.' }, { status: 403 });
  }
  if (invitation.statut !== 'en_attente') {
    return NextResponse.json({ error: 'Invitation déjà traitée.' }, { status: 409 });
  }
  const body = await req.json();
  const parse = reponseSchema.safeParse(body);
  if (!parse.success) {
    return NextResponse.json({ error: 'Requête invalide', details: parse.error.issues }, { status: 400 });
  }
  const { statut } = parse.data;
  const updated = await prisma.correspondantChat.update({
    where: { id: invitation_id },
    data: {
      statut,
      date_reponse: new Date(),
    },
  });
  // Envoi d'un email à l'invitant pour l'informer de la réponse
  const inviteur = await prisma.user.findUnique({ where: { id: invitation.inviteurId } });
  if (inviteur && inviteur.email) {
    const { Resend } = await import('resend');
    const resend = new Resend(process.env.RESEND_API_KEY);
    const html = `
      <h2>Réponse à votre invitation de correspondant</h2>
      <p>Bonjour ${inviteur.firstname || inviteur.name || ''},</p>
      <p>Votre invitation a été <b>${statut === 'accepte' ? 'acceptée' : 'refusée'}</b> par l'utilisateur invité.</p>
      <p>Connectez-vous pour voir la liste de vos correspondants.</p>
    `;
    await resend.emails.send({
      from: "NovisCoworking <noreply@noviscoworking.com>",
      to: inviteur.email,
      subject: "Réponse à votre invitation de correspondant",
      html,
    });
  }
  return NextResponse.json({ success: true, invitation: updated }, { status: 200 });
} 