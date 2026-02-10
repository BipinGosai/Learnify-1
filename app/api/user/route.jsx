import { db } from "@/config/db";
import { usersTable } from "@/config/schema";
import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getUserEmailFromRequestAsync } from "@/lib/authServer";

export async function POST(req){
    try {
        // Create a user if they do not exist (idempotent by email).
        const body = await req.json().catch(() => ({}));
        const email = body?.email;
        const nameFromBody = body?.name;

        if (!email || typeof email !== 'string') {
            return NextResponse.json({ error: 'email is required' }, { status: 400 });
        }

        // Fallback to the local-part of the email if no name is provided.
        const name = (typeof nameFromBody === 'string' && nameFromBody.trim().length > 0)
            ? nameFromBody.trim()
            : email.split('@')[0];

        // If user already exists, return it directly.
        const existingUsers = await db
            .select()
            .from(usersTable)
            .where(eq(usersTable.email, email));

        if (existingUsers?.length > 0) {
            return NextResponse.json(existingUsers[0]);
        }

        // Insert new user (race-safe: handle duplicate insert gracefully).
        try {
            const inserted = await db
                .insert(usersTable)
                .values({ name, email })
                .returning();

            return NextResponse.json(inserted?.[0] ?? { name, email });
        } catch (insertError) {
            // If another request inserted the same email concurrently
            const code = insertError?.code ?? insertError?.cause?.code;
            if (code === '23505') {
                const afterInsertUsers = await db
                    .select()
                    .from(usersTable)
                    .where(eq(usersTable.email, email));

                return NextResponse.json(afterInsertUsers?.[0] ?? { name, email });
            }
            throw insertError;
        }
    } catch (error) {
        console.error('/api/user POST failed:', error);
        return NextResponse.json(
            { error: 'Internal Server Error', message: error?.message },
            { status: 500 }
        );
    }
}

export async function PATCH(req) {
    try {
        // Only authenticated users can update their profile.
        const email = await getUserEmailFromRequestAsync(req);
        if (!email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Validate and sanitize the new name.
        const body = await req.json().catch(() => ({}));
        const nameFromBody = body?.name;
        const name = (typeof nameFromBody === 'string') ? nameFromBody.trim() : '';
        if (!name) {
            return NextResponse.json({ error: 'name is required' }, { status: 400 });
        }
        if (name.length > 255) {
            return NextResponse.json({ error: 'name is too long' }, { status: 400 });
        }

        // Persist the change and return the updated record.
        const updated = await db
            .update(usersTable)
            .set({ name })
            .where(eq(usersTable.email, email))
            .returning();

        const user = updated?.[0];
        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        return NextResponse.json({
            id: user.id,
            name: user.name,
            email: user.email,
        });
    } catch (error) {
        console.error('/api/user PATCH failed:', error);
        return NextResponse.json(
            { error: 'Internal Server Error', message: error?.message },
            { status: 500 }
        );
    }
}
