import NextAuth from "next-auth";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaClient } from "@prisma/client";
import { compare } from "bcryptjs";
import type { NextAuthOptions } from "next-auth";

type CustomUser = {
  id?: string;
  firstname?: string;
};

const prisma = new PrismaClient();

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "jwt",
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email", placeholder: "votre@email.com" },
        password: { label: "Mot de passe", type: "password" },
      },
      async authorize(credentials) {
        // Recherche de l'utilisateur par email
        const user = await prisma.user.findUnique({
          where: { email: credentials?.email },
        });

        if (!user || !user.password) {
          throw new Error("Email ou mot de passe incorrect");
        }

        // Vérification du mot de passe (hashé)
        const isValid = await compare(credentials!.password, user.password);
        if (!isValid) {
          throw new Error("Email ou mot de passe incorrect");
        }

        // On retourne l'utilisateur sans le mot de passe
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
      },
    }),
  ],
  pages: {
    signIn: "/login", // Personnalise la page de connexion si tu veux
  },
  callbacks: {
    async session({ session, token, user }) {
      if (session.user) {
        (session.user as CustomUser).id = token.sub;
        if (typeof token.firstname === 'string') {
          (session.user as CustomUser).firstname = token.firstname;
        }
      }
      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        (token as Record<string, string | undefined>).firstname = (user as CustomUser).firstname;
      }
      return token;
    },
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
