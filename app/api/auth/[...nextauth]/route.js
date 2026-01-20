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
        username: { label: 'Username', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        // Default credentials: admin/admin
        if (!credentials?.username || !credentials?.password) {
          return null
        }

        const defaultUsername = 'admin'
        const defaultPassword = 'admin'

        if (credentials.username === defaultUsername && credentials.password === defaultPassword) {
          return {
            id: '1',
            username: credentials.username,
            name: 'Admin',
            email: 'admin@nexxpay.com',
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
