import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

const reservationSchema = z.object({
  espace_id: z.string(),
  type_reservation: z.enum(['heure', 'journee', 'semaine', 'mois']),
  date_debut: z.string(), // format ISO
  date_fin: z.string().optional(),
  heure_debut: z.string().optional(),
  heure_fin: z.string().optional(),
  client_name: z.string(),
  client_email: z.string().email(),
  telephone: z.string(),
  entreprise: z.string().optional(),
  demande_speciale: z.string().optional(),
});

function getNbJours(date1: Date, date2: Date) {
  return Math.ceil((date2.getTime() - date1.getTime()) / (1000 * 60 * 60 * 24));
}
function getNbHeures(date1: Date, date2: Date) {
  return Math.ceil((date2.getTime() - date1.getTime()) / (1000 * 60 * 60));
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parse = reservationSchema.safeParse(body);
    if (!parse.success) {
      return NextResponse.json({ message: 'Données invalides', errors: parse.error.issues }, { status: 400 });
    }
    const data = parse.data;
    // Vérifier que l'espace existe et est disponible
    const espace = await prisma.espace.findUnique({ where: { id: data.espace_id } });
    if (!espace || !espace.is_available) {
      return NextResponse.json({ message: "Espace non disponible." }, { status: 400 });
    }
    // Calcul du montant total
    let montant_total = 0;
    const dateDebut = new Date(data.date_debut);
    const dateFin = data.date_fin ? new Date(data.date_fin) : dateDebut;
    if (data.type_reservation === 'heure') {
      const heureDebut = data.heure_debut ? new Date(`${data.date_debut}T${data.heure_debut}`) : dateDebut;
      const heureFin = data.heure_fin ? new Date(`${data.date_debut}T${data.heure_fin}`) : dateFin;
      const nbHeures = getNbHeures(heureDebut, heureFin);
      montant_total = nbHeures * (espace.tarif_horaire || 0);
    } else if (data.type_reservation === 'journee') {
      const nbJours = getNbJours(dateDebut, dateFin);
      montant_total = nbJours * (espace.tarif_journalier || 0);
    } else if (data.type_reservation === 'semaine') {
      const nbSemaines = getNbJours(dateDebut, dateFin) / 7;
      montant_total = Math.ceil(nbSemaines) * (espace.tarif_semaine || 0);
    } else if (data.type_reservation === 'mois') {
      const nbMois = getNbJours(dateDebut, dateFin) / 30;
      montant_total = Math.ceil(nbMois) * (espace.tarif_mensuel || 0);
    }
    // Vérifier qu'il n'y a pas de conflit de réservation sur le même espace
    let orConditions = [];
    if (data.type_reservation === 'heure' && data.heure_debut && data.heure_fin) {
      orConditions = [{
        date_debut: dateDebut,
        heure_debut: { lte: data.heure_fin },
        heure_fin: { gte: data.heure_debut },
      }];
    } else {
      orConditions = [{
        date_debut: { lte: dateFin },
        date_fin: { gte: dateDebut },
      }];
    }
    const conflits = await prisma.reservation.findFirst({
      where: {
        espaceId: data.espace_id,
        statut: { in: ['en_attente', 'confirmee'] },
        OR: orConditions,
      },
    });
    if (conflits) {
      return NextResponse.json({ message: "Conflit de réservation : l'espace est déjà réservé sur cette période." }, { status: 409 });
    }
    // Enregistrer la réservation
    const reservation = await prisma.reservation.create({
      data: {
        espaceId: data.espace_id,
        reservation_type: data.type_reservation,
        date_debut: dateDebut,
        date_fin: dateFin,
        heure_debut: data.heure_debut ?? null,
        heure_fin: data.heure_fin ?? null,
        nom_client: data.client_name,
        email_client: data.client_email,
        telephone_client: data.telephone,
        entreprise_client: data.entreprise,
        demande_speciale: data.demande_speciale,
        montant_total,
        statut: 'en_attente',
      },
    });
    // Créer une notification pour le client si user trouvé par email
    const user = await prisma.user.findUnique({ where: { email: data.client_email } });
    if (user) {
      await prisma.notification.create({
        data: {
          userId: user.id,
          titre: 'Nouvelle réservation enregistrée',
          message: `Votre réservation pour l'espace ${espace.name} a bien été enregistrée et est en attente de confirmation.`,
          date_envoie: new Date(),
        },
      });
    }
    return NextResponse.json({ message: 'Réservation enregistrée', reservation });
  } catch (error) {
    return NextResponse.json({ message: 'Erreur serveur.' }, { status: 500 });
  }
} 