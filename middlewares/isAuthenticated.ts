import { Request, Response, NextFunction } from "express";
import jwt, { Secret } from "jsonwebtoken";
import { UserModel } from "../models/userModel";

const isAuthenticated = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.token;
  if (authHeader) {
    try {
      const decoded = jwt.verify(
        authHeader as string,
        process.env.JWT_SECRET as Secret
      );
      // @ts-ignore
      res.locals.user = decoded.user;
      next();
    } catch (error: any) {
      res.json({
        error: error.message,
      });
    }
  } else {
    res.status(401).send("Unauthorized");
  }
};

export default isAuthenticated;
