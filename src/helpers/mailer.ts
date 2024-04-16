import nodemailer from "nodemailer";
import bcryptjs from "bcryptjs";
import User from "@/models/users";
import slugify from "slugify";

export async function mailer({ email, userId, reason }: any) {
  console.log(email, userId, reason, "Dddd");
  try {
    const hashedToken = await bcryptjs.hash(userId.toString(), 10);
    const finaltoken = slugify(hashedToken);
    if (reason === "VERIFY") {
      await User.findByIdAndUpdate(userId, {
        verifyToken: finaltoken,
        verifyTokenExpiry: Date.now() + 3600000,
      });
    } else if (reason === "RESET") {
      await User.findByIdAndUpdate(userId, {
        forgotPasswordToken: finaltoken,
        forgotPasswordTokenExpiry: Date.now() + 3600000,
      });
    }

    const transport = nodemailer.createTransport({
      host: "sandbox.smtp.mailtrap.io",
      port: 2525,
      auth: {
        user: process.env.TRANSPORT_USER,
        pass: process.env.TRANSPORT_PASS,
      },
    });

    const mailOptions = {
      from: "no-reply.cpet@dhiu.in",
      to: email,
      subject: "donnow",
      html: `<p>${process.env.DOMAIN}/verify?token=${finaltoken}</p>`,
    };

    const mailResponse = await transport.sendMail(mailOptions);
    return mailResponse;
  } catch (error: any) {
    throw new Error(error);
  }
}
