import { Request, Response, Router } from "express";
import passport from "passport";
import { UserController } from "~/application/controllers/UserController";
import { generateJWT } from "~/application/middlewares/AuthMiddleware";
import { CreateUserUseCase } from "~/application/useCases/User/CreateUserUseCase";
import { CreateUserValidator } from "~/application/validators/CreateUserValidator";
import nodemailer from "nodemailer";
import { UserRepository } from "../repositories/UserRepository";

const router = Router();

const userRepository = new UserRepository();
const createUserUseCase = new CreateUserUseCase(userRepository);
const userController = new UserController(createUserUseCase);

router.get(
  "/",
  passport.authenticate("jwt", { session: false }),
  userController.index
);

router.post("/login", generateJWT, async (req: Request, res: Response) => {
  const { username } = req.body;

  if (!username) {
    return res.status(400).json({ error: "Email is required." });
  }

  try {
    await sendVerificationEmail(username);

    return res.status(200).json({
      message: "Login successful, verification email sent.",
      token: req.token,
    });
  } catch (error) {
    console.error("Error sending verification email:", error);
    return res
      .status(500)
      .json({ error: "Failed to send verification email." });
  }
});

router.post("/register", CreateUserValidator, userController.create);

async function sendVerificationEmail(recipientEmail: string): Promise<void> {
  const emailRegex = /\S+@\S+\.\S+/;
  if (!emailRegex.test(recipientEmail)) {
    throw new Error("Invalid recipient email format.");
  }

  const senderEmail = "rania.chouchene.2019@gmail.com";
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
      text: `Bienvenue sur l'application de Conversion d'Unités, Uniticonve !
      Notre application vous aide à convertir entre différentes unités facilement. Que ce soit la température, la longueur, le poids, les angles ou les surfaces, nous avons tout ce qu'il vous faut !
  
      Nos Services de Conversion :
      - Température : Convertissez entre Celsius, Fahrenheit, Kelvin, et plus encore.
      - Longueur : Convertissez entre mètres, pieds, pouces, kilomètres, miles, etc.
      - Poids : Convertissez entre kilogrammes, livres, grammes, et autres unités.
      - Angles : Convertissez entre degrés, radians, et autres unités d'angles.
      - Surface : Convertissez entre mètres carrés, pieds carrés, acres, et plus encore.
      
      Cliquez ici pour vérifier votre compte.`,
    });
    console.log(`Verification email sent to ${recipientEmail}`);
  } catch (error) {
    console.error("Error sending email:", error);
    throw new Error("Failed to send the verification email.");
  }
}

export { router as userRouter };
