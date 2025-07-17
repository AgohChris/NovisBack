import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

const guestRegistrationSchema = z.object({
  evenement_id: z.string().min(1),
  nom: z.string().min(1),
  prenom: z.string().min(1),
  telephone: z.string().min(6),
  adresse: z.string().min(1),
  paye: z.boolean().optional(),
  email: z.string().email().optional(), // champ optionnel pour l'email de confirmation
});

export async function POST(req: NextRequest) {
  try {
    // Validation du body
    const body = await req.json();
    const parse = guestRegistrationSchema.safeParse(body);
    if (!parse.success) {
      return NextResponse.json({ message: 'Données invalides', errors: parse.error.issues }, { status: 400 });
    }
    const { evenement_id, nom, prenom, telephone, adresse, paye, email } = parse.data;
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
    // Vérifier que l'invité n'est pas déjà inscrit (même nom + téléphone)
    const alreadyRegistered = await prisma.guestEventRegistration.findFirst({
      where: {
        eventId: evenement_id,
        nom,
        prenom,
        telephone,
      },
    });
    if (alreadyRegistered) {
      return NextResponse.json({ message: "Cet invité est déjà inscrit à cet événement." }, { status: 400 });
    }
    // Créer l'inscription invité
    const guestRegistration = await prisma.guestEventRegistration.create({
      data: {
        eventId: evenement_id,
        nom,
        prenom,
        telephone,
        adresse,
        is_paid: paye ?? (event.price > 0 ? false : true),
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
        eventRegistration: undefined,
        reservation: undefined,
        userId: null,
        // On peut ajouter un champ guestEventRegistrationId si le modèle le permet
      },
    });
    // Lier la facture à l'inscription invité si le modèle le permet (à adapter si besoin)
    // await prisma.guestEventRegistration.update({
    //   where: { id: guestRegistration.id },
    //   data: { factureId: facture.id },
    // });

    // Envoi de l'email de confirmation si email fourni
    if (email) {
      const { Resend } = await import('resend');
      const resend = new Resend(process.env.RESEND_API_KEY);
      const eventDate = new Date(event.date).toLocaleDateString('fr-FR');
      const html = `
        <h2>Confirmation d'inscription à l'événement : ${event.title}</h2>
        <p>Bonjour ${prenom} ${nom},</p>
        <p>Vous êtes bien inscrit à l'événement <b>${event.title}</b> qui aura lieu le ${eventDate} à ${event.location}.</p>
        <p>Montant : <b>${event.price ?? 0} €</b></p>
        <p>Référence facture : <b>${facture.reference}</b></p>
        <p>Merci pour votre confiance.</p>
        <p>L'équipe NovisCoworking</p>
      `;
      await resend.emails.send({
        from: "NovisCoworking <noreply@noviscoworking.com>",
        to: email,
        subject: `Confirmation d'inscription à l'événement : ${event.title}`,
        html,
      });
    }
    // Envoi d'un email à l'auteur de l'événement
    if (event.authorId) {
      const author = await prisma.user.findUnique({ where: { id: event.authorId } });
      if (author && author.email) {
        const { Resend } = await import('resend');
        const resend = new Resend(process.env.RESEND_API_KEY);
        const html = `
          <h2>Nouvelle inscription invitée à votre événement</h2>
          <p>Bonjour ${author.firstname || author.name || ''},</p>
          <p>L'invité ${prenom} ${nom} vient de s'inscrire à votre événement <b>${event.title}</b>.</p>
          <p>Date : ${new Date(event.date).toLocaleDateString('fr-FR')} à ${event.location}</p>
        `;
        await resend.emails.send({
          from: "NovisCoworking <noreply@noviscoworking.com>",
          to: author.email,
          subject: `Nouvelle inscription invitée à votre événement : ${event.title}`,
          html,
        });
      }
    }
    return NextResponse.json({ message: "Inscription invité réussie, facture générée et email envoyé.", guestRegistration, facture });
  } catch (error) {
    return NextResponse.json({ message: 'Erreur serveur.' }, { status: 500 });
  }
} 