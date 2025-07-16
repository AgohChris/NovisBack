import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import jwt, { JwtPayload } from 'jsonwebtoken';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'secret';

const registrationSchema = z.object({
  evenement_id: z.string().min(1),
});

export async function POST(req: NextRequest) {
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
    // Validation du body
    const body = await req.json();
    const parse = registrationSchema.safeParse(body);
    if (!parse.success) {
      return NextResponse.json({ message: 'Données invalides', errors: parse.error.issues }, { status: 400 });
    }
    const { evenement_id } = parse.data;
    // Vérification de l'événement
    const event = await prisma.evennement.findUnique({ where: { id: evenement_id } });
    if (!event) {
      return NextResponse.json({ message: "Événement introuvable." }, { status: 404 });
    }
    // Vérifier qu'il reste des places
    const countUser = await prisma.eventRegistration.count({ where: { eventId: evenement_id } });
    const countGuest = await prisma.guestEventRegistration.count({ where: { eventId: evenement_id } });
    const total = countUser + countGuest;
    if (total >= event.max_participants) {
      return NextResponse.json({ message: "Plus de places disponibles." }, { status: 400 });
    }
    // Vérifier que l'utilisateur n'est pas déjà inscrit
    const alreadyRegistered = await prisma.eventRegistration.findFirst({
      where: { eventId: evenement_id, userId },
    });
    if (alreadyRegistered) {
      return NextResponse.json({ message: "Déjà inscrit à cet événement." }, { status: 400 });
    }
    // Créer l'inscription
    const registration = await prisma.eventRegistration.create({
      data: {
        eventId: evenement_id,
        userId,
        is_favorite: false,
        is_paid: event.price > 0 ? false : true,
        registration_date: new Date(),
      },
    });

    // Générer la facture
    const { v4: uuidv4 } = await import('uuid');
    const facture = await prisma.facture.create({
      data: {
        reference: uuidv4(),
        montant: event.price ?? 0,
        statut: event.price > 0 ? 'En attente' : 'Payée',
        userId,
        eventRegistration: { connect: { id: registration.id } },
      },
    });
    // Lier la facture à l'inscription
    await prisma.eventRegistration.update({
      where: { id: registration.id },
      data: { factureId: facture.id },
    });

    // Créer une notification pour l'utilisateur
    await prisma.notification.create({
      data: {
        userId,
        titre: `Inscription à l'événement : ${event.title}`,
        message: `Votre inscription à l'événement "${event.title}" a bien été prise en compte.`,
        date_envoie: new Date(),
      },
    });

    // Récupérer l'email de l'utilisateur
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (user && user.email) {
      // Envoi de l'email de confirmation
      const { Resend } = await import('resend');
      const resend = new Resend(process.env.RESEND_API_KEY);
      const eventDate = new Date(event.date).toLocaleDateString('fr-FR');
      const html = `
        <h2>Confirmation d'inscription à l'événement : ${event.title}</h2>
        <p>Bonjour ${user.firstname || ''},</p>
        <p>Vous êtes bien inscrit à l'événement <b>${event.title}</b> qui aura lieu le ${eventDate} à ${event.location}.</p>
        <p>Montant : <b>${event.price ?? 0} €</b></p>
        <p>Référence facture : <b>${facture.reference}</b></p>
        <p>Merci pour votre confiance.</p>
        <p>L'équipe NovisCoworking</p>
      `;
      await resend.emails.send({
        from: "NovisCoworking <noreply@noviscoworking.com>",
        to: user.email,
        subject: `Confirmation d'inscription à l'événement : ${event.title}`,
        html,
      });
    }
    return NextResponse.json({ message: "Inscription réussie, facture générée et email envoyé.", registration, facture });
  } catch (error) {
    return NextResponse.json({ message: 'Erreur serveur.' }, { status: 500 });
  }
} 