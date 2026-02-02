import nodemailer from "nodemailer";
import { db } from "@/lib/db";

export async function sendNotification(userId: string, subject: string, message: string) {
    // Look up the user's email
    const user = await db.user.findUnique({ where: { id: userId }, select: { email: true } });
    if (!user?.email) {
        console.error(`[EMAIL ERROR] No email found for user ${userId}`);
        return false;
    }

    // Gmail SMTP Configuration
    const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
    });

    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: user.email,
        subject: `[Review & Rule] ${subject}`,
        text: message,
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`[EMAIL SENT] To User ${userId}: ${subject}`);
        return true;
    } catch (error) {
        console.error("[EMAIL ERROR]", error);
        return false;
    }
}

