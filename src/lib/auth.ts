import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import connectDB from "@/lib/db";
import { User } from "@/models/User";
import bcrypt from "bcryptjs";

export const authOptions: NextAuthOptions = {
    providers: [
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                username: { label: "Username", type: "text" },
                password: { label: "Password", type: "password" }
            },
            async authorize(credentials) {
                if (!credentials?.username || !credentials?.password) {
                    throw new Error("Invalid credentials");
                }

                await connectDB();

                // Accept login by username OR email — students register with email
                // and are assigned an auto-generated username they may not know.
                const identifier = credentials.username.trim().toLowerCase();
                const user = await User.findOne({
                    $or: [
                        { username: identifier },
                        { email: identifier },
                    ],
                });

                if (!user || !user.password) {
                    throw new Error("User not found");
                }

                const isPasswordMatch = await bcrypt.compare(credentials.password as string, user.password);

                if (!isPasswordMatch) {
                    throw new Error("Invalid password");
                }

                return {
                    id: user._id.toString(),
                    name: user.fullName,
                    email: user.email,
                    role: user.role,
                    username: user.username,
                    isProfileComplete: user.isProfileComplete,
                    status: user.status,
                };
            }
        }),
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        }),
    ],
    callbacks: {
        async signIn({ user, account }) {
            if (account?.provider === 'google') {
                await connectDB();
                const email = user.email?.toLowerCase().trim();
                if (!email) return false;

                let dbUser = await User.findOne({ email });
                if (!dbUser) {
                    // New Google user — start as pending, admin must approve
                    let baseUsername = email.split('@')[0].replace(/[^a-zA-Z0-9]/g, '');
                    if (!baseUsername) baseUsername = 'user';
                    let username = baseUsername;
                    let counter = 0;
                    while (await User.findOne({ username })) {
                        counter++;
                        username = `${baseUsername}${counter}`;
                    }

                    dbUser = await User.create({
                        username,
                        email,
                        fullName: user.name || email.split('@')[0],
                        role: 'student',
                        provider: 'google',
                        image: user.image || undefined,
                        status: 'pending',
                        isEmailVerified: true,
                    });
                } else {
                    // Existing user — block if rejected
                    if (dbUser.status === 'rejected') {
                        return '/login?error=AccountRejected';
                    }
                    // Link Google, mark verified
                    await User.findByIdAndUpdate(dbUser._id, {
                        isEmailVerified: true,
                        ...(dbUser.provider === 'credentials' && { provider: 'google' }),
                        ...(user.image && !dbUser.image && { image: user.image }),
                    });
                    const { StudentProfile } = await import('@/models/StudentProfile');
                    await StudentProfile.findOneAndUpdate(
                        { userId: dbUser._id },
                        { emailVerified: true }
                    );
                }
            }
            return true;
        },
        async jwt({ token, user, account, trigger }) {
            // ── Initial sign-in via credentials ─────────────────────────────
            if (user && account?.provider === 'credentials') {
                // Block rejected accounts at token level too
                if ((user as any).status === 'rejected') throw new Error('AccountRejected');
                token.role = user.role;
                token.username = user.username;
                token.id = user.id;
                token.isProfileComplete = user.isProfileComplete ?? false;
                token.provider = 'credentials';
                token.status = (user as any).status ?? 'pending';
            }
            // ── Initial sign-in via Google ───────────────────────────────────
            if (account?.provider === 'google' && user?.email) {
                await connectDB();
                const dbUser = await User.findOne({ email: user.email.toLowerCase().trim() });
                if (dbUser) {
                    token.role = dbUser.role;
                    token.username = dbUser.username;
                    token.id = dbUser._id.toString();
                    token.isProfileComplete = dbUser.isProfileComplete;
                    token.provider = dbUser.provider || 'google';
                    token.status = dbUser.status;
                }
            }
            // ── Token refresh / session.update() call ────────────────────────
            // Re-read from DB so that calling update() on the client actually
            // propagates the new isProfileComplete value into the JWT.
            if (trigger === 'update' && token.id) {
                await connectDB();
                const dbUser = await User.findById(token.id).select('isProfileComplete role username provider status').lean();
                if (dbUser) {
                    token.isProfileComplete = dbUser.isProfileComplete;
                    token.role = dbUser.role;
                    token.provider = dbUser.provider;
                    token.status = dbUser.status;
                }
            }
            return token;
        },
        async session({ session, token }) {
            if (session.user) {
                session.user.role = token.role as string;
                session.user.username = token.username as string;
                session.user.id = token.id as string;
                session.user.isProfileComplete = token.isProfileComplete as boolean;
                session.user.provider = token.provider as string;
                session.user.status = token.status as string;
            }
            return session;
        }
    },
    pages: {
        signIn: '/login',
    },
    session: {
        strategy: "jwt",
    },
    secret: process.env.NEXTAUTH_SECRET,
};
