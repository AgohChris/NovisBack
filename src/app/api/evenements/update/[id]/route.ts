import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import jwt, { JwtPayload } from 'jsonwebtoken';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'secret';

const eventUpdateSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
  type_evenement: z.enum(['Conference', 'Networking', 'Workshop', 'Social', 'Formation']).optional(),
  date: z.string().optional(), // ISO
  start_time: z.string().optional(), // HH:mm
  end_time: z.string().optional(),   // HH:mm
  location: z.string().min(1).optional(),
  max_participants: z.number().int().min(1).optional(),
  price: z.number().optional(),
  is_free: z.boolean().optional(),
});

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
    const isAdmin = payload.isAdmin || false;
    if (!userId) {
      return NextResponse.json({ message: 'Utilisateur non trouvé.' }, { status: 404 });
    }
    // Récupérer l'événement
    const event = await prisma.evennement.findUnique({ where: { id: params.id } });
    if (!event) {
      return NextResponse.json({ message: "Événement introuvable." }, { status: 404 });
    }
    // Vérifier droits (créateur ou admin)
    if (event.authorId !== userId && !isAdmin) {
      return NextResponse.json({ message: "Accès refusé. Seul le créateur ou un admin peut modifier." }, { status: 403 });
    }
    // Restriction si déjà publié ou inscrits
    const inscrits = await prisma.eventRegistration.count({ where: { evenementId: params.id } });
    if (event.est_publie || inscrits > 0) {
      return NextResponse.json({ message: "Impossible de modifier un événement déjà publié ou avec des inscrits." }, { status: 400 });
    }
    // Validation du body
    const body = await req.json();
    const parse = eventUpdateSchema.safeParse(body);
    if (!parse.success) {
      return NextResponse.json({ message: 'Données invalides', errors: parse.error.issues }, { status: 400 });
    }
    const data = parse.data;
    // Construction des dates si besoin
    let updateData: any = { ...data };
    if (data.date && data.start_time) {
      updateData.start_time = new Date(`${data.date}T${data.start_time}`);
    }
    if (data.date && data.end_time) {
      updateData.end_time = new Date(`${data.date}T${data.end_time}`);
    }
    if (data.date) {
      updateData.date = new Date(data.date);
    }
    // Mise à jour
    const updated = await prisma.evennement.update({
      where: { id: params.id },
      data: updateData,
    });
    return NextResponse.json({ message: "Événement modifié avec succès.", event: updated });
  } catch (error) {
    return NextResponse.json({ message: 'Erreur serveur.' }, { status: 500 });
  }
} 