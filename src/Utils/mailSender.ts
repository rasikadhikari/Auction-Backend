import nodemailer from "nodemailer";
import dotenv from "dotenv";
import SMTPTransport from "nodemailer/lib/smtp-transport"; // important for types

dotenv.config();

export const sendMail = async (options: {
  email: string;
  subject: string;
  message: string;
}) => {
  if (!options.email) {
    throw new Error("No recipient defined");
  }

  const transportOptions: SMTPTransport.Options = {
    host: process.env.MAIL_HOST,
    port: Number(process.env.MAIL_PORT),
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASSWORD,
    },
  };

  const transporter = nodemailer.createTransport(transportOptions);

  const message = {
    from: `${process.env.SMPT_NAME} <${process.env.SMPT_FROM_EMAIL}>`,
    to: options.email,
    subject: options.subject,
    html: options.message,
  };

  await transporter.sendMail(message);
};
