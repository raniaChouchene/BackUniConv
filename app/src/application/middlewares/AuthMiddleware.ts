import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import User from "~/domain/entities/User/User";
import { SECRET_KEY } from "~/infra/constants/env";
const verifyUser = async (req: Request, res: Response): Promise<Response> => {
  const { token } = req.query; // Get token from query string

  if (!token) {
    return res.status(400).json({ error: "Token is required" });
  }

  try {
    // Verify the token
    const decoded: any = jwt.verify(
      token as string,
      process.env.SECRET_KEY || "default_secret"
    );

    // Find the user by email
    const user = await User.findOne({ email: decoded.email });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Activate the user's account (this is just an example, implement your own logic)
    user.isActive = true;
    await user.save();

    return res.status(200).json({ message: "Account verified successfully!" });
  } catch (error) {
    console.error("Error verifying token:", error);
    return res.status(400).json({ error: "Invalid or expired token" });
  }
};

export { verifyUser };
async function generateJWT(req: Request, res: Response, next: NextFunction) {
  if (req.headers) {
    const token = req.headers.authorization;

    if (token) {
      return res.status(400).json({ error: "A token already exists" });
    }

    const { username } = req.body;

    const user = await User.findOne({ username });

    if (!user) {
      return res.status(400).json({ error: "User not exists" });
    }

    const passwordIsValid = await bcrypt.compare(
      req.body.password,
      user.password
    );

    if (!passwordIsValid) {
      return res
        .status(400)
        .json({ error: "Failed to login, invalid password" });
    }

    const { id } = user;

    const newToken = jwt.sign({ id }, SECRET_KEY, { expiresIn: "1d" });
    req.token = newToken;
    next();
  }
}

export { generateJWT };
