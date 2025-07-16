import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user?.email) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
  }
  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) {
    return NextResponse.json({ error: 'Utilisateur introuvable' }, { status: 401 });
  }
  const { searchParams } = new URL(req.url);
  const from = searchParams.get('from');
  const to = searchParams.get('to');
  const statut = searchParams.get('statut');
  const utilisateur = searchParams.get('utilisateur');
  const where: any = {};
  if (from || to) {
    where.created_at = {};
    if (from) where.created_at.gte = new Date(from);
    if (to) where.created_at.lte = new Date(to);
  }
  if (statut) where.statut = statut;
  // Si pas admin, filtre sur userId
  if (user.role !== 'admin') {
    where.userId = user.id;
  } else if (utilisateur) {
    where.userId = utilisateur;
  }
  const factures = await prisma.facture.findMany({
    where,
    orderBy: { created_at: 'desc' },
    select: {
      id: true,
      reference: true,
      montant: true,
      created_at: true,
      statut: true,
      userId: true,
      reservationId: true,
    },
  });
  return NextResponse.json({ factures }, { status: 200 });
} 