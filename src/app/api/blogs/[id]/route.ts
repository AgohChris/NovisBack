import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/authOptions';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const blog = await prisma.blog.findUnique({
    where: { id: params.id },
    include: { auteur: { select: { id: true, name: true, firstname: true } } },
  });
  if (!blog) {
    return NextResponse.json({ error: 'Article introuvable' }, { status: 404 });
  }
  if (blog.status === 'brouillon') {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }
    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user || user.id !== blog.auteurId) {
      return NextResponse.json({ error: 'Accès interdit.' }, { status: 403 });
    }
  }
  return NextResponse.json({ blog }, { status: 200 });
} 