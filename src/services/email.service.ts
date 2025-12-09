import dotenv from "dotenv";
import nodemailer from "nodemailer";

dotenv.config();

// Create transporter (using Gmail as example, you can configure for other services)
const createTransporter = () => {
  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: "harshsangani32@gmail.com",
      pass: "rurrwabauqosjrdo", // Use App Password for Gmail
    },
  });
};

export const sendOTPEmail = async (email: string, otp: string, firstName: string): Promise<void> => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Verify Your Email - OTP Code",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Email Verification</h2>
          <p>Hello ${firstName},</p>
          <p>Thank you for registering! Please use the following OTP to verify your email address:</p>
          <div style="background-color: #f4f4f4; padding: 20px; text-align: center; margin: 20px 0;">
            <h1 style="color: #007bff; font-size: 32px; margin: 0;">${otp}</h1>
          </div>
          <p>This OTP will expire in 10 minutes.</p>
          <p>If you didn't register for this account, please ignore this email.</p>
          <p>Best regards,<br>Auth Flow Team</p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`OTP email sent to ${email}`);
  } catch (error) {
    console.error("Error sending email:", error);
    throw new Error("Failed to send OTP email");
  }
};

