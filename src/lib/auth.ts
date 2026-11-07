import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { connectDB } from './db';
import { loginSchema } from './validations';
import User from '@/models/User';
import { ensureMonthlyPayments } from './payments';

/**
 * NextAuth configuration — Credentials provider with JWT sessions.
 * CSRF protection is provided by NextAuth's built-in CSRF token on sign-in.
 */
export const authOptions: NextAuthOptions = {
  session: { strategy: 'jwt', maxAge: 60 * 60 * 24 * 7 }, // 7 days
  pages: { signIn: '/login' },
  secret: process.env.NEXTAUTH_SECRET,
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        // RATE LIMITING: in production, throttle login attempts per IP/email here
        // (e.g. Upstash Ratelimit or a Redis token bucket) to slow brute-force attacks.
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) throw new Error('Invalid email or password');

        try {
          await connectDB();
        } catch (err) {
          console.error('[auth] database connection failed', err);
          throw new Error('Cannot reach the database. Check MONGODB_URI and that MongoDB is running.');
        }
        const user = await User.findOne({ email: parsed.data.email }).select('+password');
        if (!user) throw new Error('Invalid email or password');

        const valid = await bcrypt.compare(parsed.data.password, user.password);
        if (!valid) throw new Error('Invalid email or password');
        if (!user.isActive) throw new Error('Your membership is inactive. Please contact the front desk.');

        // Generate this month's pending payments on login (idempotent & throttled).
        ensureMonthlyPayments().catch((err) => console.error('[payments] ensure failed', err));

        return {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.name = user.name;
      }
      // Allow client-side `update({ name })` after profile edits.
      if (trigger === 'update' && session?.name) token.name = session.name;
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.name = token.name ?? session.user.name;
      }
      return session;
    },
  },
};
