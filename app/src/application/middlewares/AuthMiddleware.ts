import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import User from "~/domain/entities/User/User";
import { SECRET_KEY } from "~/infra/constants/env";

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
