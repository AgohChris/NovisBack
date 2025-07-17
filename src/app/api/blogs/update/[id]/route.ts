import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/authOptions';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const blogSchema = z.object({
  title: z.string().optional(),
  categorie: z.string().optional(),
  extrait: z.string().optional(),
  contenu: z.string().optional(),
  tags: z.array(z.string()).optional(),
  a_la_une: z.boolean().optional(),
  status: z.enum(['brouillon', 'publie']).optional(),
  image: z.string().optional(),
});

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user?.email) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
  }
  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) {
    return NextResponse.json({ error: 'Utilisateur introuvable' }, { status: 401 });
  }
  const blog = await prisma.blog.findUnique({ where: { id: params.id } });
  if (!blog) {
    return NextResponse.json({ error: 'Article introuvable' }, { status: 404 });
  }
  if (blog.auteurId !== user.id) {
    return NextResponse.json({ error: 'Accès interdit.' }, { status: 403 });
  }
  const body = await req.json();
  const parse = blogSchema.safeParse(body);
  if (!parse.success) {
    return NextResponse.json({ error: 'Requête invalide', details: parse.error.issues }, { status: 400 });
  }
  const data = parse.data;
  const updated = await prisma.blog.update({
    where: { id: params.id },
    data: {
      ...data,
      updated_at: new Date(),
    },
  });
  return NextResponse.json({ success: true, blog: updated }, { status: 200 });
} 