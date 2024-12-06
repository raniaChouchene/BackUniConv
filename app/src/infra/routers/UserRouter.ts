import { Request, Response, Router } from "express";
import passport from "passport";
import {
  sendForgotPasswordEmail,
  sendVerificationEmail,
  UserController,
} from "~/application/controllers/UserController";
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
router.post("/resetPassword", userController.resetPassword);
router.post("/forgettenPassWord", async (req: Request, res: Response) => {
  const { username } = req.body;

  if (!username) {
    return res.status(400).json({ error: "Email is required." });
  }

  try {
    await sendForgotPasswordEmail(username);

    return res.status(200).json({
      message: "Password reset email sent successfully.",
    });
  } catch (error) {
    console.error("Error sending reset password email:", error);
    return res
      .status(500)
      .json({ error: "Failed to send reset password email." });
  }
});

router.post("/register", CreateUserValidator, userController.create);

export { router as userRouter };
