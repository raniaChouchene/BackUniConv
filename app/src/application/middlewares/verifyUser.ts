import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import User from "~/domain/entities/User/User";
const verifyUser = async (req: Request, res: Response): Promise<Response> => {
  const { token } = req.body;

  if (!token) {
    return res.status(400).json({ error: "Token is required" });
  }

  try {
    // Décodage du token
    const decoded: any = jwt.verify(
      token,
      process.env.SECRET_KEY || "default_secret"
    );

    console.log("Token décodé:", decoded); // Log pour voir le contenu du token

    const user = await User.findOne({ email: decoded.email });
    if (!user) {
      return res.status(404).json({ error: "Utilisateur introuvable" });
    }

    user.isActive = true;
    await user.save();

    return res.status(200).json({ message: "Compte vérifié avec succès" });
  } catch (error) {
    console.error("Erreur lors de la vérification du token :", error);
    return res.status(400).json({ error: "Token invalide ou expiré" });
  }
};

export { verifyUser };
