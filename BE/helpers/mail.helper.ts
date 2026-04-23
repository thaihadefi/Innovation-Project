import nodemailer from "nodemailer";
import { GMAIL_USER, GMAIL_PASS } from "../config/env";

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: GMAIL_USER,
    pass: GMAIL_PASS,
  },
});

export const sendEmail = async (to: string, subject: string, html: string): Promise<void> => {
  try {
    const info = await transporter.sendMail({
      from: GMAIL_USER,
      to,
      subject,
      html
    });
    console.log(`[Email] Sent to ${to}:`, info.response);
  } catch (err: any) {
    console.error(`[Email] Failed to send to ${to}:`, err?.message || err);
    throw err;
  }
};
