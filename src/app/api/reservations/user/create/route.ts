import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/authOptions';

const prisma = new PrismaClient();

const reservationSchema = z.object({
  espace_id: z.string(),
  type_reservation: z.enum(['heure', 'journee', 'semaine', 'mois']),
  date_debut: z.string(),
  date_fin: z.string().optional(),
  heure_debut: z.string().optional(),
  heure_fin: z.string().optional(),
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
    // Authentification avec NextAuth
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ message: 'Non authentifié.' }, { status: 401 });
    }
    
    const userId = session.user.id;
    const user = session.user;
    
    if (!userId) {
      return NextResponse.json({ message: 'ID utilisateur manquant dans la session.' }, { status: 401 });
    }
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
    // Enregistrer la réservation
    const reservation = await prisma.reservation.create({
      data: {
        userId,
        espaceId: data.espace_id,
        reservation_type: data.type_reservation,
        date_debut: dateDebut,
        date_fin: dateFin,
        heure_debut: data.heure_debut ?? null,
        heure_fin: data.heure_fin ?? null,
        nom_client: user.firstname || '',
        email_client: user.email || '',
        telephone_client: '', // à compléter si stocké dans User
        entreprise_client: data.entreprise,
        demande_speciale: data.demande_speciale,
        montant_total,
        statut: 'en_attente',
      },
    });
    // Créer une notification pour l'utilisateur
    await prisma.notification.create({
      data: {
        userId,
        titre: 'Nouvelle réservation enregistrée',
        message: `Votre réservation pour l'espace ${espace.name} a bien été enregistrée et est en attente de confirmation.`,
        date_envoie: new Date(),
      },
    });
    return NextResponse.json({ message: 'Réservation enregistrée', reservation });
  } catch (error) {
    console.error('Erreur dans /api/reservations/user/create:', error);
    return NextResponse.json({ message: 'Erreur serveur.' }, { status: 500 });
  }
} 