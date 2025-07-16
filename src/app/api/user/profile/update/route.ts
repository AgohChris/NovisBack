import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import jwt, { JwtPayload } from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'secret';

export async function PUT(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ message: 'Non authentifié.' }, { status: 401 });
    }
    const token = authHeader.split(' ')[1];
    let payload: JwtPayload;
    try {
      payload = jwt.verify(token, JWT_SECRET) as JwtPayload;
    } catch {
      return NextResponse.json({ message: 'Token invalide.' }, { status: 401 });
    }
    const userId = payload.id || payload.userId;
    if (!userId) {
      return NextResponse.json({ message: 'Utilisateur non trouvé.' }, { status: 404 });
    }
    const body = await req.json();
    const { first_name, last_name, email, old_password, new_password, confirm_new_password } = body;

    // Préparer les données à mettre à jour
    const dataToUpdate: any = {};
    if (first_name) dataToUpdate.firstname = first_name;
    if (last_name) dataToUpdate.name = last_name;
    if (email) {
      // Vérifier unicité de l'email
      const existing = await prisma.user.findUnique({ where: { email } });
      if (existing && existing.id !== userId) {
        return NextResponse.json({ message: 'Cet email est déjà utilisé.' }, { status: 400 });
      }
      dataToUpdate.email = email;
    }

    // Gestion du changement de mot de passe
    if (old_password || new_password || confirm_new_password) {
      if (!old_password || !new_password || !confirm_new_password) {
        return NextResponse.json({ message: 'Pour changer le mot de passe, tous les champs sont requis.' }, { status: 400 });
      }
      if (new_password !== confirm_new_password) {
        return NextResponse.json({ message: 'Les nouveaux mots de passe ne correspondent pas.' }, { status: 400 });
      }
      // Vérifier l'ancien mot de passe
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user || !user.password) {
        return NextResponse.json({ message: 'Utilisateur ou mot de passe introuvable.' }, { status: 404 });
      }
      const isMatch = await bcrypt.compare(old_password, user.password);
      if (!isMatch) {
        return NextResponse.json({ message: 'Ancien mot de passe incorrect.' }, { status: 400 });
      }
      // Hacher le nouveau mot de passe
      dataToUpdate.password = await bcrypt.hash(new_password, 10);
    }

    if (Object.keys(dataToUpdate).length === 0) {
      return NextResponse.json({ message: 'Aucune donnée à mettre à jour.' }, { status: 400 });
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: dataToUpdate,
    });
    return NextResponse.json({
      first_name: updatedUser.firstname,
      last_name: updatedUser.name,
      email: updatedUser.email,
      message: 'Profil mis à jour avec succès.'
    });
  } catch (error) {
    return NextResponse.json({ message: 'Erreur serveur.' }, { status: 500 });
  }
} 