import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const messageSchema = z.object({
  conversation_id: z.string().optional(),
  destinataire_id: z.string().optional(),
  contenu: z.string().max(2000).optional(),
  fichier: z.string().url({ message: "URL invalide" }).or(z.literal(null)).optional(),
  type: z.enum(['texte', 'appel_audio', 'appel_video']),
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
  const parse = messageSchema.safeParse(body);
  if (!parse.success) {
    return NextResponse.json({ error: 'Requête invalide', details: parse.error.issues }, { status: 400 });
  }
  const { conversation_id, destinataire_id, contenu, fichier, type } = parse.data;

  let conversation;
  if (conversation_id) {
    // Vérifie que l'utilisateur est bien participant
    conversation = await prisma.conversation.findUnique({
      where: { id: conversation_id },
    });
    if (!conversation || (conversation.utilisateur1Id !== userId && conversation.utilisateur2Id !== userId)) {
      return NextResponse.json({ error: 'Accès interdit à cette conversation.' }, { status: 403 });
    }
  } else {
    // Création auto si pas de conversation_id fourni
    if (!destinataire_id) {
      return NextResponse.json({ error: 'destinataire_id requis si pas de conversation_id.' }, { status: 400 });
    }
    // Vérifie que le destinataire est bien un correspondant accepté
    const isCorrespondant = await prisma.correspondantChat.findFirst({
      where: {
        statut: 'accepte',
        OR: [
          { inviteurId: userId, inviteId: destinataire_id },
          { inviteurId: destinataire_id, inviteId: userId },
        ],
      },
    });
    if (!isCorrespondant) {
      return NextResponse.json({ error: 'Vous ne pouvez discuter qu’avec vos correspondants.' }, { status: 403 });
    }
    // Cherche une conversation existante
    conversation = await prisma.conversation.findFirst({
      where: {
        OR: [
          { utilisateur1Id: userId, utilisateur2Id: destinataire_id },
          { utilisateur1Id: destinataire_id, utilisateur2Id: userId },
        ],
      },
    });
    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: {
          utilisateur1Id: userId,
          utilisateur2Id: destinataire_id,
        },
      });
    }
  }
  // Crée le message
  const message = await prisma.message.create({
    data: {
      conversationId: conversation.id,
      expediteurId: userId,
      contenu,
      fichier,
      type,
    },
  });
  // Met à jour la date de la conversation
  await prisma.conversation.update({
    where: { id: conversation.id },
    data: { updated_at: new Date() },
  });
  // Envoi d'un email au destinataire
  let destinataireId;
  if (conversation.utilisateur1Id === userId) {
    destinataireId = conversation.utilisateur2Id;
  } else {
    destinataireId = conversation.utilisateur1Id;
  }
  const destinataire = await prisma.user.findUnique({ where: { id: destinataireId } });
  if (destinataire && destinataire.email) {
    const { Resend } = await import('resend');
    const resend = new Resend(process.env.RESEND_API_KEY);
    const html = `
      <h2>Nouveau message reçu</h2>
      <p>Bonjour ${destinataire.firstname || destinataire.name || ''},</p>
      <p>Vous avez reçu un nouveau message sur NovisCoworking.</p>
      <p>Contenu : ${contenu || '(Message sans texte)'}</p>
      <p>Connectez-vous pour répondre.</p>
    `;
    await resend.emails.send({
      from: "NovisCoworking <noreply@noviscoworking.com>",
      to: destinataire.email,
      subject: "Nouveau message reçu sur NovisCoworking",
      html,
    });
  }
  return NextResponse.json({ success: true, message }, { status: 201 });
} 