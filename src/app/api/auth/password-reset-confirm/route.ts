import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  try {
    const { token, new_password, confirm_new_password } = await req.json();
    if (!token || !new_password || !confirm_new_password) {
      return NextResponse.json({ message: 'Token, nouveau mot de passe et confirmation requis.' }, { status: 400 });
    }
    if (new_password !== confirm_new_password) {
      return NextResponse.json({ message: 'Les mots de passe ne correspondent pas.' }, { status: 400 });
    }

    // Vérifier le token
    const resetToken = await prisma.passwordResetToken.findUnique({ where: { token } });
    if (!resetToken || resetToken.expiresAt < new Date()) {
      return NextResponse.json({ message: 'Token invalide ou expiré.' }, { status: 400 });
    }

    // Hacher le nouveau mot de passe
    const hashedPassword = await bcrypt.hash(new_password, 10);

    // Mettre à jour le mot de passe de l'utilisateur
    await prisma.user.update({
      where: { id: resetToken.userId },
      data: { password: hashedPassword },
    });

    // Supprimer le token utilisé
    await prisma.passwordResetToken.delete({ where: { token } });

    return NextResponse.json({ message: 'Mot de passe réinitialisé avec succès.' });
  } catch (error) {
    return NextResponse.json({ message: 'Erreur serveur.' }, { status: 500 });
  }
} 