import { Resend } from "resend";
import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";
import { NextResponse } from "next/server";

const prisma = new PrismaClient();
const resend = new Resend(process.env.RESEND_API_KEY);

async function sendWelcomeEmail(to: string, name: string) {
  await resend.emails.send({
    from: "NovisCoworking <noreply@noviscoworking.com>", // Personnalise ce domaine selon ton setup Resend
    to,
    subject: "Bienvenue sur NovisCoworking !",
    html: `<p>Bonjour <b>${name}</b>,<br><br>Bienvenue sur NovisCoworking ! Nous sommes ravis de t'accueillir.</p>`,
    text: `Bonjour ${name},\n\nBienvenue sur NovisCoworking ! Nous sommes ravis de t'accueillir.`,
  });
}

export async function POST(request: Request) {
  const { name, firstname, email, password, confirmPassword } = await request.json();

  // Vérification des champs requis
  if (!name || !firstname || !email || !password || !confirmPassword) {
    return NextResponse.json({ error: "Champs manquants" }, { status: 400 });
  }

  // Vérification de la correspondance des mots de passe
  if (password !== confirmPassword) {
    return NextResponse.json({ error: "Les mots de passe ne correspondent pas" }, { status: 400 });
  }

  // Vérifie si l'utilisateur existe déjà
  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    return NextResponse.json({ error: "Email déjà utilisé" }, { status: 400 });
  }

  // Hash du mot de passe
  const hashedPassword = await hash(password, 10);

  // Création de l'utilisateur
  const user = await prisma.user.create({
    data: {
      name,
      firstname,
      email,
      password: hashedPassword,
    },
  });

  // Envoi du mail de bienvenue
  await sendWelcomeEmail(email, name);

  // On ne retourne pas le mot de passe !
  const { password: _, ...userWithoutPassword } = user;

  return NextResponse.json({ user: userWithoutPassword }, { status: 201 });
}
