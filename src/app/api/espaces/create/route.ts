import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

const espaceSchema = z.object({
  name: z.string().min(1),
  type: z.string(),
  sous_type: z.string().optional(),
  description: z.string().optional(),
  capacite: z.number().int().min(1),
  localisation: z.string().optional(),
  image_url: z.string().optional(),
  tarif_horaire: z.number().optional(),
  tarif_journalier: z.number().optional(),
  tarif_semaine: z.number().optional(),
  tarif_mensuel: z.number().optional(),
  is_available: z.boolean().optional(),
  equipement_wifi: z.boolean().optional(),
  equipement_ecran: z.boolean().optional(),
  equipement_projecteur: z.boolean().optional(),
  equipement_tableau_blanc: z.boolean().optional(),
  equipement_imprimante: z.boolean().optional(),
  equipement_climatisation: z.boolean().optional(),
  equipement_casiers: z.boolean().optional(),
  equipement_cafe: z.boolean().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parse = espaceSchema.safeParse(body);
    if (!parse.success) {
      return NextResponse.json({ message: 'Données invalides', errors: parse.error.issues }, { status: 400 });
    }
    const espace = await prisma.espace.create({ data: parse.data });
    return NextResponse.json({ message: 'Espace créé avec succès', espace });
  } catch (error) {
    return NextResponse.json({ message: 'Erreur serveur.' }, { status: 500 });
  }
} 