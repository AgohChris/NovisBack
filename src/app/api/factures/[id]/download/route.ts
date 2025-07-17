import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/authOptions';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user?.email) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
  }
  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) {
    return NextResponse.json({ error: 'Utilisateur introuvable' }, { status: 401 });
  }
  const facture = await prisma.facture.findUnique({ where: { id: params.id } });
  if (!facture) {
    return NextResponse.json({ error: 'Facture introuvable' }, { status: 404 });
  }
  if (facture.userId !== user.id && user.role !== 'admin') {
    return NextResponse.json({ error: 'Accès interdit.' }, { status: 403 });
  }
  // Ici, tu brancheras la génération ou la récupération du PDF réel
  // Pour l'instant, on retourne un PDF fictif (ou un message)
  // Exemple :
  // return new NextResponse(pdfBuffer, { headers: { 'Content-Type': 'application/pdf' } });
  return NextResponse.json({ message: 'PDF à générer ou à servir ici.' }, { status: 200 });
} 