import { NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { db } from "@/lib/db";
import * as z from "zod";

// Input validation schema
const userSchema = z.object({
    name: z.string().min(1, "Name is required"),
    email: z.string().min(1, "Email is required").email("Invalid email"),
    password: z.string().min(8, "Password must be at least 8 characters"),
});

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { email, password, name } = userSchema.parse(body);

        // Check if email already exists
        const existingUser = await db.user.findUnique({
            where: { email },
        });

        if (existingUser) {
            return NextResponse.json(
                { user: null, message: "User with this email already exists" },
                { status: 409 }
            );
        }

        const hashedPassword = await hash(password, 10);

        const newUser = await db.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
            },
        });

        // Remove password from response
        const { password: _, ...userWithoutPassword } = newUser;

        return NextResponse.json(
            { user: userWithoutPassword, message: "User created successfully" },
            { status: 201 }
        );
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { message: "Invalid input", errors: error.issues },
                { status: 400 }
            );
        }
        return NextResponse.json(
            { message: "Something went wrong" },
            { status: 500 }
        );
    }
}
