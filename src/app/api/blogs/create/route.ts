import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const blogSchema = z.object({
  title: z.string(),
  categorie: z.string(),
  extrait: z.string(),
  contenu: z.string(),
  tags: z.array(z.string()).optional(),
  a_la_une: z.boolean().optional(),
  status: z.enum(['brouillon', 'publie']),
  image: z.string().optional(),
});

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user?.email) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
  }
  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) {
    return NextResponse.json({ error: 'Utilisateur introuvable' }, { status: 401 });
  }
  const body = await req.json();
  const parse = blogSchema.safeParse(body);
  if (!parse.success) {
    return NextResponse.json({ error: 'Requête invalide', details: parse.error.issues }, { status: 400 });
  }
  const data = parse.data;
  const blog = await prisma.blog.create({
    data: {
      ...data,
      tags: data.tags || [],
      a_la_une: data.a_la_une ?? false,
      publier_le: data.status === 'publie' ? new Date() : new Date(),
      auteurId: user.id,
    },
  });
  return NextResponse.json({ success: true, blog }, { status: 201 });
} 