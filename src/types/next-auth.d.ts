import NextAuth, { DefaultSession } from "next-auth"

declare module "next-auth" {
    interface Session {
        user: {
            role: string
            username: string
            id: string
            isProfileComplete: boolean
        } & DefaultSession["user"]
    }

    interface User {
        role: string
        username: string
        id: string
        isProfileComplete?: boolean
    }
}

declare module "next-auth/jwt" {
    interface JWT {
        role: string
        username: string
        id: string
        isProfileComplete: boolean
    }
}
