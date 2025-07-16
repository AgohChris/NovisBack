import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { randomBytes } from 'crypto';
import { Resend } from 'resend';

const prisma = new PrismaClient();
const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    if (!email) {
      return NextResponse.json({ message: 'Email requis.' }, { status: 400 });
    }

    // Vérifier si l'utilisateur existe
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      // Réponse générique pour ne pas révéler l'existence de l'email
      return NextResponse.json({ message: 'Si cet email existe, un lien de réinitialisation a été envoyé.' });
    }

    // Générer un token unique
    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 min

    // Supprimer les anciens tokens pour cet utilisateur
    await prisma.passwordResetToken.deleteMany({ where: { userId: user.id } });

    // Enregistrer le nouveau token
    await prisma.passwordResetToken.create({
      data: {
        token,
        userId: user.id,
        expiresAt,
      },
    });

    // Envoyer l'email avec le lien de réinitialisation
    const resetLink = `${process.env.FRONTEND_URL}?token=${token}`;
    await resend.emails.send({
      from: 'noreply@noviscoworking.com',
      to: email,
      subject: 'Réinitialisation de votre mot de passe',
      html: `<p>Bonjour,</p><p>Vous avez demandé à réinitialiser votre mot de passe. Cliquez sur le lien ci-dessous pour définir un nouveau mot de passe :</p><p><a href="${resetLink}">${resetLink}</a></p><p>Ce lien est valable 30 minutes.</p><p>Si vous n'êtes pas à l'origine de cette demande, ignorez cet email.</p>`
    });

    return NextResponse.json({ message: 'Si cet email existe, un lien de réinitialisation a été envoyé.' });
  } catch (error) {
    return NextResponse.json({ message: 'Erreur serveur.' }, { status: 500 });
  }
} 