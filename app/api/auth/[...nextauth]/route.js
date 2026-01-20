import NextAuth from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'

// Default values untuk development
const defaultSecret = 'nexflow-dashboard-secret-key-change-in-production-2024'
const defaultUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'

const authOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        // Demo authentication - accept any credentials
        // In production, validate against your database
        if (credentials?.email && credentials?.password) {
          return {
            id: '1',
            email: credentials.email,
            name: 'Admin User',
            role: 'admin',
          }
        }
        return null
      },
    }),
  ],
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = user.role
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id
        session.user.role = token.role
      }
      return session
    },
  },
  secret: process.env.NEXTAUTH_SECRET || defaultSecret,
  trustHost: true,
}

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }
