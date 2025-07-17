import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

const updateEspaceSchema = z.object({
  name: z.string().optional(),
  type: z.string().optional(),
  sous_type: z.string().optional(),
  description: z.string().optional(),
  capacite: z.number().int().optional(),
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

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const body = await req.json();
    const parse = updateEspaceSchema.safeParse(body);
    if (!parse.success) {
      return NextResponse.json({ message: 'Données invalides', errors: parse.error.issues }, { status: 400 });
    }
    const espace = await prisma.espace.update({
      where: { id },
      data: parse.data,
    });
    return NextResponse.json({ message: 'Espace modifié avec succès', espace });
  } catch {
    return NextResponse.json({ message: 'Erreur serveur ou espace introuvable.' }, { status: 500 });
  }
} 