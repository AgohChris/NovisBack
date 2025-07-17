import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import jwt, { JwtPayload } from 'jsonwebtoken';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'secret';

const updateReservationSchema = z.object({
  date_debut: z.string().optional(),
  date_fin: z.string().optional(),
  heure_debut: z.string().optional(),
  heure_fin: z.string().optional(),
  type_reservation: z.enum(['heure', 'journee', 'semaine', 'mois']).optional(),
  entreprise: z.string().optional(),
  demande_speciale: z.string().optional(),
});

function getNbJours(date1: Date, date2: Date) {
  return Math.ceil((date2.getTime() - date1.getTime()) / (1000 * 60 * 60 * 24));
}
function getNbHeures(date1: Date, date2: Date) {
  return Math.ceil((date2.getTime() - date1.getTime()) / (1000 * 60 * 60));
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
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
    if (reservation.statut !== 'en_attente') {
      return NextResponse.json({ message: 'Modification impossible, statut non modifiable.' }, { status: 400 });
    }
    // Validation des données
    const body = await req.json();
    const parse = updateReservationSchema.safeParse(body);
    if (!parse.success) {
      return NextResponse.json({ message: 'Données invalides', errors: parse.error.issues }, { status: 400 });
    }
    const data = parse.data;
    // Recalcul du montant si dates/type changent
    const montant_total = reservation.montant_total;
    const type_reservation = data.type_reservation || reservation.reservation_type;
    const dateDebut = data.date_debut ? new Date(data.date_debut) : reservation.date_debut;
    const dateFin = data.date_fin ? new Date(data.date_fin) : reservation.date_fin || reservation.date_debut;
    const espace = await prisma.espace.findUnique({ where: { id: reservation.espaceId } });
    if (!espace) {
      return NextResponse.json({ message: 'Espace non trouvé.' }, { status: 404 });
    }
    if (type_reservation === 'heure') {
      const heureDebut = data.heure_debut ? new Date(`${data.date_debut || reservation.date_debut.toISOString().slice(0,10)}T${data.heure_debut}`) : reservation.heure_debut;
      const heureFin = data.heure_fin ? new Date(`${data.date_debut || reservation.date_debut.toISOString().slice(0,10)}T${data.heure_fin}`) : reservation.heure_fin;
      const nbHeures = getNbHeures(heureDebut as Date, heureFin as Date);
      montant_total = nbHeures * (espace.tarif_horaire || 0);
    } else if (type_reservation === 'journee') {
      const nbJours = getNbJours(dateDebut, dateFin as Date);
      montant_total = nbJours * (espace.tarif_journalier || 0);
    } else if (type_reservation === 'semaine') {
      const nbSemaines = getNbJours(dateDebut, dateFin as Date) / 7;
      montant_total = Math.ceil(nbSemaines) * (espace.tarif_semaine || 0);
    } else if (type_reservation === 'mois') {
      const nbMois = getNbJours(dateDebut, dateFin as Date) / 30;
      montant_total = Math.ceil(nbMois) * (espace.tarif_mensuel || 0);
    }
    // Mise à jour
    const updated = await prisma.reservation.update({
      where: { id },
      data: {
        ...data,
        date_debut: dateDebut,
        date_fin: dateFin,
        montant_total,
        reservation_type: type_reservation,
        heure_debut: data.heure_debut ?? reservation.heure_debut,
        heure_fin: data.heure_fin ?? reservation.heure_fin,
      },
    });
    // Envoi d'email si la réservation est confirmée
    if (updated.statut === 'confirmee') {
      const user = updated.userId ? await prisma.user.findUnique({ where: { id: updated.userId } }) : null;
      const email = user?.email || updated.email_client;
      if (email) {
        const { Resend } = await import('resend');
        const resend = new Resend(process.env.RESEND_API_KEY);
        const html = `
          <h2>Réservation confirmée</h2>
          <p>Votre réservation pour l'espace ${updated.espaceId} a été confirmée.</p>
        `;
        await resend.emails.send({
          from: "NovisCoworking <noreply@noviscoworking.com>",
          to: email,
          subject: "Votre réservation a été confirmée",
          html,
        });
      }
    }
    return NextResponse.json({ message: 'Réservation modifiée', reservation: updated });
  } catch (error) {
    return NextResponse.json({ message: 'Erreur serveur.' }, { status: 500 });
  }
} 