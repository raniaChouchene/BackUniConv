/* eslint-disable no-unused-vars */
/* eslint-disable no-empty-function */
/* eslint-disable no-useless-constructor */
import { Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import User from "~/domain/entities/User/User";
import "dotenv/config";
import { SECRET_KEY } from "~/infra/constants/env";
import { IUser } from "~/domain/entities/User/IUser";
import { ICreateUserUseCase } from "~/domain/useCases/User/ICreateUserUseCase";
import nodemailer from "nodemailer";

export interface IIndexUserRequest extends Request {
  user?: IUser;
}

class UserController {
  constructor(private readonly createUserUseCase: ICreateUserUseCase) {}

  create = async (req: Request, res: Response): Promise<Response> => {
    const userData = req.body;

    if (!userData.name || !userData.username || !userData.password) {
      return res.status(400).json({ error: "Fill required fields" });
    }

    const passwordHash = await bcrypt.hash(userData.password, 8);

    userData.password = passwordHash;

    const userAlreadyExists = await User.findOne({
      username: userData.username,
    });

    if (userAlreadyExists) {
      return res.status(400).json({ error: "User already exists" });
    }

    const { id } = await this.createUserUseCase.create(userData);

    const token = jwt.sign({ id }, SECRET_KEY, { expiresIn: "1d" });

    return res.status(201).json({ token });
  };

  async index(req: IIndexUserRequest, res: Response) {
    const { user } = req;

    if (!user) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    return res.send(`Welcome ${user.name}`);
  }
  resetPassword = async (req: Request, res: Response): Promise<Response> => {
    const { username, password, validePassword } = req.body;

    // Step 1: Validate input
    if (!username || !password || !validePassword) {
      return res.status(400).json({ error: "All fields are required" });
    }

    // Step 2: Check if passwords match
    if (password !== validePassword) {
      return res.status(400).json({ error: "Passwords do not match" });
    }

    // Step 3: Find the user by username
    const user = await User.findOne({ username });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Step 4: Hash the new password
    const hashedPassword = await bcrypt.hash(password, 8);

    user.password = hashedPassword;
    await user.save();

    return res.status(200).json({ message: "Password reset successfully" });
  };

  verifyUser = async (req: Request, res: Response): Promise<Response> => {
    try {
      const decoded = jwt.verify(
        req.body.token,
        process.env.SECRET_KEY || "default_secret"
      );
      console.log("Token decoded:", decoded);
      return res.status(200).json({ message: "User verified successfully" });
    } catch (error) {
      console.error("Error verifying user:", error);
      return res.status(400).json({ error: "User verification failed" });
    }
  };
}

async function sendVerificationEmail(recipientEmail: string): Promise<void> {
  const emailRegex = /\S+@\S+\.\S+/;
  if (!emailRegex.test(recipientEmail)) {
    throw new Error("Invalid recipient email format.");
  }

  const senderEmail = "rania.chouchene.2019@gmail.com";

  const verificationToken = jwt.sign(
    { email: recipientEmail },
    process.env.SECRET_KEY || "default_secret",
    { expiresIn: "1h" }
  );

  const verificationUrl = `${"http://localhost:4200/"}/verify?token=${verificationToken}`;

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: "rania.chouchene.2019@gmail.com",
      pass: "qdta cqdq jtpv locs",
    },
  });

  try {
    await transporter.sendMail({
      from: senderEmail,
      to: recipientEmail,
      subject: "Verify Your Account",
      html: `
        <p>Bienvenue sur l'application de Conversion d'Unités, Uniticonve !</p>
        <p>Notre application vous aide à convertir entre différentes unités facilement. Que ce soit la température, la longueur, le poids, les angles ou les surfaces, nous avons tout ce qu'il vous faut !</p>
        <h3>Nos Services de Conversion :</h3>
        <ul>
          <li>Température : Convertissez entre Celsius, Fahrenheit, Kelvin, et plus encore.</li>
          <li>Longueur : Convertissez entre mètres, pieds, pouces, kilomètres, miles, etc.</li>
          <li>Poids : Convertissez entre kilogrammes, livres, grammes, et autres unités.</li>
          <li>Angles : Convertissez entre degrés, radians, et autres unités d'angles.</li>
          <li>Surface : Convertissez entre mètres carrés, pieds carrés, acres, et plus encore.</li>
        </ul>
        <p>Cliquez sur le lien ci-dessous pour vérifier votre compte :</p>
        <p><a href="${verificationUrl}">${verificationUrl}</a></p>
        <p>Ce lien expirera dans une heure.</p>


  
      `,
    });

    console.log(`Verification email sent to ${recipientEmail}`);
  } catch (error) {
    console.error("Error sending email:", error);
    throw new Error("Failed to send the verification email.");
  }
}
async function sendForgotPasswordEmail(recipientEmail: string): Promise<void> {
  const emailRegex = /\S+@\S+\.\S+/;
  if (!emailRegex.test(recipientEmail)) {
    throw new Error("Invalid recipient email format.");
  }

  const senderEmail = "rania.chouchene.2019@gmail.com";

  const resetToken = jwt.sign(
    { email: recipientEmail },
    process.env.SECRET_KEY || "default_secret",
    { expiresIn: "1h" }
  );

  const resetUrl = `${"http://localhost:4200/reset-password?token="}${resetToken}`;

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: "rania.chouchene.2019@gmail.com",
      pass: "qdta cqdq jtpv locs", // Consider using environment variables for security
    },
  });

  try {
    await transporter.sendMail({
      from: senderEmail,
      to: recipientEmail,
      subject: "Update Your Account",
      html: `
        <p>Bienvenue sur l'application de Conversion d'Unités, Uniticonve !</p>
        <p>Vous avez oublié votre mot de passe ? Pas de problème, cliquez sur ce lien pour le réinitialiser :</p>
        <h3><a href="http://localhost:4200/ResetPassWord">http://localhost:4200/ResetPassWord</a></h3>
        <p>Ce lien expirera dans une heure.</p>
      `,
    });

    console.log(`Password reset email sent to ${recipientEmail}`);
  } catch (error) {
    console.error("Error sending email:", error);
    throw new Error("Failed to send the reset password email.");
  }
}

export { UserController, sendVerificationEmail, sendForgotPasswordEmail };
