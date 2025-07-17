import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/authOptions';
import { prisma } from '@/lib/prisma';

// ✅ Signature correcte pour Next.js App Router
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }
    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user) {
      return NextResponse.json({ error: 'Utilisateur introuvable' }, { status: 401 });
    }
    const userId = user.id;
    // Vérifie que l'utilisateur est bien participant
    const conversation = await prisma.conversation.findUnique({ where: { id } });
    if (!conversation || (conversation.utilisateur1Id !== userId && conversation.utilisateur2Id !== userId)) {
      return NextResponse.json({ error: 'Accès interdit à cette conversation.' }, { status: 403 });
    }
    // Récupère l'historique des appels
    const appels = await prisma.appel.findMany({
      where: { conversationId: id },
      orderBy: { debut_appel: 'desc' },
      select: {
        id: true,
        appelantId: true,
        debut_appel: true,
        fin_appel: true,
        duree: true,
        type_appel: true,
        etat: true,
      },
    });
    return NextResponse.json({ success: true, conversationId: id, appels });
  } catch (error) {
    console.error('Erreur lors de la récupération de la conversation:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération de la conversation' },
      { status: 500 }
    );
  }
}

// Exemple de POST (à adapter selon besoin)
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    // Logique POST ici
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erreur POST:', error);
    return NextResponse.json(
      { error: 'Erreur lors du traitement' },
      { status: 500 }
    );
  }
} 