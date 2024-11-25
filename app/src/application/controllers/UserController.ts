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

export { UserController, sendVerificationEmail };
