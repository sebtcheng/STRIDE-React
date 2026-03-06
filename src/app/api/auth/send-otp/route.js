import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

export async function POST(request) {
    try {
        const { email } = await request.json();

        if (!email) {
            return NextResponse.json({ error: 'Email is required' }, { status: 400 });
        }

        if (!email.toLowerCase().endsWith('@deped.gov.ph')) {
            return NextResponse.json({ error: 'Unauthorized: Only @deped.gov.ph emails are allowed.' }, { status: 403 });
        }

        // Generate 6-digit OTP
        const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

        // Expiration 10 minutes from now
        const expiresAt = new Date(Date.now() + 10 * 60000);

        // Delete any existing OTPs for this email to prevent spam/clutter
        await pool.query('DELETE FROM otps WHERE email = $1', [email.toLowerCase()]);

        // Insert new OTP
        const insertQuery = `
            INSERT INTO otps (email, otp_code, expires_at)
            VALUES ($1, $2, $3)
        `;
        await pool.query(insertQuery, [email.toLowerCase(), otpCode, expiresAt]);

        // Send Email
        const mailOptions = {
            from: `"STRIDE Access" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: 'Your STRIDE Registration OTP',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
                    <div style="text-align: center; margin-bottom: 20px;">
                        <h2 style="color: #003366; margin: 0;">STRIDE Registration</h2>
                    </div>
                    <p style="color: #333; font-size: 16px;">Hello,</p>
                    <p style="color: #333; font-size: 16px;">Here is your One-Time Password (OTP) to verify your email address for your STRIDE account registration:</p>
                    <div style="background-color: #f4f6f9; border: 1px dashed #003366; padding: 15px; text-align: center; margin: 20px 0; border-radius: 4px;">
                        <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #CE1126;">${otpCode}</span>
                    </div>
                    <p style="color: #666; font-size: 14px;">This code will expire in <strong>10 minutes</strong>. Do not share this code with anyone.</p>
                    <hr style="border: 0; border-top: 1px solid #eee; margin: 30px 0;" />
                    <p style="color: #999; font-size: 12px; text-align: center;">This is an automated message from the STRIDE system. Please do not reply.</p>
                </div>
            `
        };

        await transporter.sendMail(mailOptions);

        return NextResponse.json({ success: true, message: 'OTP sent successfully' }, { status: 200 });

    } catch (error) {
        console.error('Error sending OTP:', error);
        return NextResponse.json({ error: 'Failed to send OTP' }, { status: 500 });
    }
}
