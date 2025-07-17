import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const categorie = searchParams.get('categorie');
  const tag = searchParams.get('tag');
  const status = searchParams.get('status');
  const a_la_une = searchParams.get('a_la_une');
  const q = searchParams.get('q');
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = parseInt(searchParams.get('limit') || '10', 10);
  const skip = (page - 1) * limit;
  const where: Record<string, unknown> = {};
  if (categorie) where.categorie = categorie;
  if (status) where.status = status;
  if (a_la_une) where.a_la_une = a_la_une === 'true';
  if (tag) where.tags = { has: tag };
  if (q) {
    where.OR = [
      { title: { contains: q, mode: 'insensitive' } },
      { extrait: { contains: q, mode: 'insensitive' } },
      { tags: { has: q } },
    ];
  }
  const articles = await prisma.blog.findMany({
    where,
    orderBy: { publier_le: 'desc' },
    skip,
    take: limit,
    select: {
      id: true,
      title: true,
      categorie: true,
      extrait: true,
      a_la_une: true,
      status: true,
      image: true,
      publier_le: true,
      auteur: { select: { id: true, name: true, firstname: true } },
      tags: true,
    },
  });
  return NextResponse.json({ articles }, { status: 200 });
} 