import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import type { JWT } from "next-auth/jwt"
import type { Session } from "next-auth"

// Define a custom user type interface
interface CustomUser {
  email: string;
  id: string;
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  secret: process.env.AUTH_SECRET,
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        const email = credentials.email as string | undefined;
        const password = credentials.password as string | undefined;

        if (!email || !password) {
          throw new Error("Please provide both email & password");
        }

        // Get credentials from environment variables
        const envEmail = process.env.ADMIN_EMAIL;
        const envPassword = process.env.ADMIN_PASSWORD;
        const envId = process.env.ADMIN_ID;

        if (!envEmail || !envPassword || !envId) {
          throw new Error("Environment variables not properly configured");
        }

        // Check if provided credentials match environment variables
        const isValidEmail = email === envEmail;
        const isValidPassword = password === envPassword;

        if (!isValidEmail) {
          throw new Error("Invalid email");
        }

        if (!isValidPassword) {
          throw new Error("Password did not match");
        }

        // Return user object with email and id only
        const userResponse: CustomUser = {
          email: envEmail,
          id: envId,
        };

        return userResponse;
      },
    }),
  ],
  pages: {
    signIn: "/auth/login",
  },
  callbacks: {
    async session({ session, token }: { session: Session, token: JWT }) {
      if (token?.sub) {
        session.user = session.user || {};
        session.user.id = token.sub;
        // Only include email in the session
        session.user.email = token.email as string;
      }
      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        const customUser = user as CustomUser;
        token.email = customUser.email;
      }
      return token;
    },
  },
})