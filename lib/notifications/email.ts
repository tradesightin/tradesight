import nodemailer from "nodemailer";

export async function sendNotification(userId: string, subject: string, message: string) {
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
        to: "user_email_placeholder@example.com", // In real app, fetch user.email via userId
        subject: `[Tradesight] ${subject}`,
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

