import { PrismaAdapter } from "@next-auth/prisma-adapter";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaClient } from "@prisma/client";
import { compare } from "bcryptjs";
import type { NextAuthOptions } from "next-auth";

type CustomUser = {
  id: string;
  email: string;
  name: string;
  firstname: string;
  role: string;
};

const prisma = new PrismaClient();

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email", placeholder: "votre@email.com" },
        password: { label: "Mot de passe", type: "password" },
      },
      async authorize(credentials) {
        const user = await prisma.user.findUnique({
          where: { email: credentials?.email },
        });
        if (!user || !user.password) throw new Error("Email ou mot de passe incorrect");
        const isValid = await compare(credentials!.password, user.password);
        if (!isValid) throw new Error("Email ou mot de passe incorrect");
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
      },
    }),
  ],
  pages: { signIn: "/login" },
  callbacks: {
    async session({ session, token }) {
      if (session.user && token) {
        session.user = {
          ...session.user,
          id: token.id as string,
          email: token.email as string,
          name: token.name as string,
          firstname: token.firstname as string,
          role: token.role as string,
        };
      }
      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        const customUser = user as CustomUser;
        token.id = customUser.id;
        token.email = customUser.email;
        token.name = customUser.name;
        token.firstname = customUser.firstname;
        token.role = customUser.role;
      }
      return token;
    },
  },
}; 