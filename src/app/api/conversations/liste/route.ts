import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/authOptions';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || !session.user?.email) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
  }
  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) {
    return NextResponse.json({ error: 'Utilisateur introuvable' }, { status: 401 });
  }
  const userId = user.id;
  // Récupère toutes les conversations où l'utilisateur est participant
  const conversations = await prisma.conversation.findMany({
    where: {
      OR: [
        { utilisateur1Id: userId },
        { utilisateur2Id: userId },
      ],
    },
    include: {
      utilisateur_1: { select: { id: true, name: true, firstname: true, email: true, image: true } },
      utilisateur_2: { select: { id: true, name: true, firstname: true, email: true, image: true } },
      messages: {
        orderBy: { horodatage: 'desc' },
        take: 1,
        select: { id: true, type: true, contenu: true, horodatage: true }
      },
    },
    orderBy: { updated_at: 'desc' },
  });
  // Formate la réponse pour inclure l'autre utilisateur et le dernier message
  const result = conversations.map(conv => {
    const autre = conv.utilisateur1Id === userId ? conv.utilisateur_2 : conv.utilisateur_1;
    return {
      id: conv.id,
      autre_utilisateur: {
        id: autre.id,
        nom: autre.name,
        prenom: autre.firstname,
        email: autre.email,
        photo: autre.image,
      },
      last_message: conv.messages[0] || null,
      updated_at: conv.updated_at,
    };
  });
  return NextResponse.json({ conversations: result }, { status: 200 });
} 