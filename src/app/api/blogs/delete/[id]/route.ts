import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/authOptions';
import { prisma } from '@/lib/prisma';

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
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
  await prisma.blog.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true }, { status: 200 });
} 