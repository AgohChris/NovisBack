import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import jwt, { JwtPayload } from 'jsonwebtoken';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'secret';

const eventSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  type_evenement: z.enum(['Conference', 'Networking', 'Workshop', 'Social', 'Formation']),
  date: z.string(), // ISO
  start_time: z.string(), // HH:mm
  end_time: z.string(),   // HH:mm
  location: z.string().min(1),
  max_participants: z.number().int().min(1),
  price: z.number().optional(),
  is_free: z.boolean(),
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
    // Validation
    const body = await req.json();
    const parse = eventSchema.safeParse(body);
    if (!parse.success) {
      return NextResponse.json({ message: 'Données invalides', errors: parse.error.issues }, { status: 400 });
    }
    const data = parse.data;
    // Construction des dates complètes
    const date = new Date(data.date);
    const start_time = new Date(`${data.date}T${data.start_time}`);
    const end_time = new Date(`${data.date}T${data.end_time}`);
    // Création de l'événement
    const event = await prisma.evennement.create({
      data: {
        title: data.title,
        description: data.description,
        type_evenement: data.type_evenement,
        date,
        start_time,
        end_time,
        location: data.location,
        max_participants: data.max_participants,
        price: data.price ?? 0,
        is_free: data.is_free,
        authorId: userId,
      },
    });
    return NextResponse.json({ message: "Événement créé avec succès", event });
  } catch {
    return NextResponse.json({ message: 'Erreur serveur.' }, { status: 500 });
  }
} 