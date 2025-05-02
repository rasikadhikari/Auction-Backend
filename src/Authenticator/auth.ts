import { Request, Response, NextFunction } from "express";
import Jwt, { JwtPayload } from "jsonwebtoken";

export interface AuthRequest extends Request {
  user?: JwtPayload & { id: string; role: string; email: string; name: string };
}

export const auth = (req: AuthRequest, res: Response, next: NextFunction) => {
  const header = req.headers["authorization"];
  const token = header && header.split(" ")[1];
  console.log(token);

  if (token == null) {
    res.status(400).json({ message: "Token is not found" });
    return;
  }
  try {
    const verify = Jwt.verify(token, "secret") as JwtPayload & {
      id: string;
      role: string;
      email: string;
      name: string;
    };
    console.log("Decoded Token Payload:", verify);
    req.user = verify;
    next();
  } catch (err) {
    console.log(err);
    res.status(400).json({ message: "invalid token" });
    return;
  }
};

export const authorizeRoles = (role: "buyer" | "seller" | "admin") => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    const user = req.user as JwtPayload;
    if (user.role !== role) {
      res
        .status(403)
        .json({ message: "You are not authorized to access this resource" });
      return;
    }
    next();
  };
};
