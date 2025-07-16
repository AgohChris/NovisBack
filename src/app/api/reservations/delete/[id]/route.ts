import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import jwt, { JwtPayload } from 'jsonwebtoken';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'secret';

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Authentification
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ message: 'Non authentifié.' }, { status: 401 });
    }
    const token = authHeader.split(' ')[1];
    let payload: JwtPayload;
    try {
      payload = jwt.verify(token, JWT_SECRET) as JwtPayload;
    } catch {
      return NextResponse.json({ message: 'Token invalide.' }, { status: 401 });
    }
    const userId = payload.id || payload.userId;
    if (!userId) {
      return NextResponse.json({ message: 'Utilisateur non trouvé.' }, { status: 404 });
    }
    // Vérifier la réservation
    const { id } = params;
    const reservation = await prisma.reservation.findUnique({ where: { id } });
    if (!reservation) {
      return NextResponse.json({ message: 'Réservation non trouvée.' }, { status: 404 });
    }
    if (reservation.userId !== userId) {
      return NextResponse.json({ message: 'Accès refusé.' }, { status: 403 });
    }
    if (reservation.statut === 'en_attente') {
      await prisma.reservation.delete({ where: { id } });
      // Envoi d'email de suppression
      const user = reservation.userId ? await prisma.user.findUnique({ where: { id: reservation.userId } }) : null;
      const email = user?.email || reservation.email_client;
      if (email) {
        const { Resend } = await import('resend');
        const resend = new Resend(process.env.RESEND_API_KEY);
        const html = `
          <h2>Réservation supprimée</h2>
          <p>Votre réservation pour l'espace ${reservation.espaceId} a été supprimée.</p>
        `;
        await resend.emails.send({
          from: "NovisCoworking <noreply@noviscoworking.com>",
          to: email,
          subject: "Votre réservation a été supprimée",
          html,
        });
      }
      return NextResponse.json({ message: 'Réservation supprimée.' });
    } else {
      await prisma.reservation.update({ where: { id }, data: { statut: 'annulee' } });
      // Envoi d'email d'annulation
      const user = reservation.userId ? await prisma.user.findUnique({ where: { id: reservation.userId } }) : null;
      const email = user?.email || reservation.email_client;
      if (email) {
        const { Resend } = await import('resend');
        const resend = new Resend(process.env.RESEND_API_KEY);
        const html = `
          <h2>Réservation annulée</h2>
          <p>Votre réservation pour l'espace ${reservation.espaceId} a été annulée.</p>
        `;
        await resend.emails.send({
          from: "NovisCoworking <noreply@noviscoworking.com>",
          to: email,
          subject: "Votre réservation a été annulée",
          html,
        });
      }
      return NextResponse.json({ message: 'Réservation annulée.' });
    }
  } catch (error) {
    return NextResponse.json({ message: 'Erreur serveur.' }, { status: 500 });
  }
} 