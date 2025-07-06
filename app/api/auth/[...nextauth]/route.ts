import NextAuth, { AuthOptions, SessionStrategy } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { PrismaAdapter } from "@next-auth/prisma-adapter"
import { PrismaClient, User as PrismaUser } from "@prisma/client"
import bcrypt from "bcrypt"
import type { JWT } from "next-auth/jwt"
import type { AdapterUser } from "next-auth/adapters"

const prisma = new PrismaClient()

export const authOptions = {
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "jwt" as SessionStrategy
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials): Promise<Omit<PrismaUser, 'password'> | null> {
        if (!credentials?.email || !credentials?.password) return null
        const user = await prisma.user.findUnique({ where: { email: credentials.email } })
        if (!user) return null
        const isValid = await bcrypt.compare(credentials.password, user.password)
        if (!isValid) return null
        // Don't return password hash
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { password: _pw, ...userWithoutPassword } = user
        return userWithoutPassword as Omit<PrismaUser, 'password'>
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }: {
      token: JWT;
      user?: AdapterUser | PrismaUser;
      account?: any;
      profile?: any;
      trigger?: "signIn" | "signUp" | "update";
      isNewUser?: boolean;
      session?: any;
    }) {
      if (user) {
        // Ensure user has emailVerified property for AdapterUser compatibility
        const safeUser = {
          ...user,
          emailVerified: (user as AdapterUser).emailVerified ?? (user as any).emailVerified ?? null
        } as AdapterUser & { role?: string }
        token.id = safeUser.id
        if (safeUser.role) token.role = safeUser.role
        token.email = safeUser.email
        token.name = safeUser.name
      }
      return token
    },
    async session({ session, token }: { session: any; token: JWT }) {
      if (token) {
        session.user.id = token.id
        session.user.role = token.role
        session.user.email = token.email
        session.user.name = token.name
      }
      return session
    }
  },
  pages: {
    signIn: "/login"
  }
}

const handler = NextAuth(authOptions as AuthOptions)
export { handler as GET, handler as POST } 