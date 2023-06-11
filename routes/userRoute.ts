import express, { Response, Request, Router } from "express";
import { body, validationResult } from "express-validator";
import User from "../models/userModel";
import { omit } from "lodash";
import bcrypt from "bcrypt";
import multer from "multer";
import { v4 as uuidv4 } from "uuid";
import path from "path";
import jwt, { Secret } from "jsonwebtoken";
import isAuthenticated from "../middlewares/isAuthenticated";
import rateLimit from "express-rate-limit";

const createUserLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 2,
  message: {
    error:
      "You can create only 2 accounts in 1 hour.",
  },
  statusCode: 200,
});

const router: Router = express.Router();

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "public/images");
  },
  filename: function (req, file, cb) {
    cb(null, uuidv4() + "-" + Date.now() + path.extname(file.originalname));
  },
});

const fileFilter = (
  req: Express.Request,
  file: Express.Multer.File,
  cb: any
) => {
  const allowedFileTypes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/gif",
  ];
  if (allowedFileTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(null, false);
  }
};

const upload = multer({
  storage: storage,
  limits: { fileSize: 1024 * 1024 * 3 },
  fileFilter: fileFilter,
});

//register
router.post(
  "/register",
  // upload.single("image"),
  body("username")
    .exists()
    .withMessage("username is required")
    .isLength({
      min: 4,
      max: 20,
    })
    .withMessage("username must be between 4 and 20 characters"),
  body("email")
    .exists()
    .withMessage("email is required")
    .isEmail()
    .withMessage("email must be valid"),
  body("password")
    .exists()
    .withMessage("password is required")
    .isLength({
      min: 8,
      max: 20,
    })
    .withMessage("password must be between 8 and 20 characters")
    .matches(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[^a-zA-Z0-9]).{8,}$/, "i")
    .withMessage(
      "Password should be combination of one uppercase,one lower case,one special char and one digit"
    ),
  createUserLimiter,
  async (req: Request, res: Response) => {
    const { username, email, password } = req.body;
    // const image = req?.file?.filename;
    try {
      const userbyemail = await User.findOne({ email });
      const userbyusername = await User.findOne({ username });
      if (userbyemail || userbyusername) {
        res.json({
          error: "username or email already exists",
        });
      } else {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
          res.json({
            error: errors.array()[0].msg,
          });
        } else {
          const userboi = await User.create({
            username: username,
            email: email,
            password: password,
            // image: image,
          });
          const userboi2 = omit(userboi.toJSON(), ["password", "email"]);
          res.status(201).json(userboi2);
        }
      }
    } catch (error: any) {
      res.send({
        error: error.message,
      });
    }
  }
);

//login
router.post(
  "/login",
  body("email")
    .exists()
    .withMessage("email is required")
    .isEmail()
    .withMessage("email must be valid"),
  body("password")
    .exists()
    .withMessage("password is required")
    .isLength({
      min: 8,
      max: 20,
    })
    .withMessage("password must be between 8 and 20 characters"),
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.json({
          error: errors.array()[0].msg,
        });
      } else {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if (!user) {
          res.json({
            error: "Invalid credentials",
          });
        } else {
          const hashedpass = await bcrypt.compare(password, user.password);
          if (!hashedpass) {
            res.json({
              error: "Invalid credentials",
            });
          } else {
            const userboi = omit(user.toJSON(), ["password", "email"]);
            const token = jwt.sign(
              {
                user: userboi,
              },
              process.env.JWT_SECRET as Secret,
              {
                expiresIn: "69h", // :)
              }
            );
            res.status(200).json({
              token: token,
            });
          }
        }
      }
    } catch (error: any) {
      res.send({
        error: error.message,
      });
    }
  }
);

//update profile
router.put(
  "/update_profile",
  // upload.single("image"),
  body("username")
    .exists()
    .withMessage("username is required")
    .isLength({
      min: 4,
      max: 20,
    })
    .withMessage("username must be between 4 and 20 characters"),
  body("email")
    .exists()
    .withMessage("email is required")
    .isEmail()
    .withMessage("email must be valid"),
  isAuthenticated,
  async (req: Request, res: Response) => {
    const { username, email, bio } = req.body;
    // const image = req?.file?.filename;
    const userId = res.locals.user._id;
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.json({
          error: errors.array()[0].msg,
        });
      } else {
        await User.findByIdAndUpdate(userId, {
          username: username,
          email: email,
          bio: bio,
          // image: image,
        });
        const userboi = await User.findById(userId);
        const userboi2 = omit(userboi?.toJSON(), ["password", "email"]);
        res.status(200).json(userboi2);
      }
    } catch (error: any) {
      res.send({
        error: error.message,
      });
    }
  }
);

//get user by id
router.get("/getbyid/:userId", async (req: Request, res: Response) => {
  const { userId } = req.params;
  try {
    const userboi = await User.findById(userId);
    const userboi2 = omit(userboi?.toJSON(), ["password", "email"]);
    res.status(200).json(userboi2);
  } catch (error: any) {
    res.send({
      error: "user not found",
    });
  }
});

//folllow user
router.put(
  "/follow/:userId",
  isAuthenticated,
  async (req: Request, res: Response) => {
    const { userId } = req.params;
    const currentuserId = res.locals.user._id;
    try {
      const user = await User.findById(userId);
      const currentuser = await User.findById(currentuserId);
      if (userId === currentuserId) {
        res.json({
          error: "You can't follow yourself",
        });
      } else {
        if (!user?.followers.includes(currentuserId as never)) {
          await user?.updateOne({
            $push: {
              followers: currentuserId,
            },
          });
          await currentuser?.updateOne({
            $push: {
              following: userId,
            },
          });
          const userboi = await User.findById(userId);
          const userboi2 = omit(userboi?.toJSON(), "password");
          res.status(200).json(userboi2);
        } else {
          await user?.updateOne({
            $pull: {
              followers: currentuserId,
            },
          });
          await currentuser?.updateOne({
            $pull: {
              following: userId,
            },
          });
          const userboi3 = await User.findById(userId);
          const userboi4 = omit(userboi3?.toJSON(), "password");
          res.status(200).json(userboi4);
        }
      }
    } catch (error: any) {
      res.send({
        error: error.message,
      });
    }
  }
);

//who to follow
router.get(
  "/whotofollow",
  isAuthenticated,
  async (req: Request, res: Response) => {
    const currentuserId = res.locals.user._id;
    try {
      const users = await User.find({
        _id: {
          $nin: [currentuserId],
        },
      })
        .sort({
          createdAt: -1,
        })
        .limit(3);
      const users2 = users.map((user: any) => {
        return omit(user.toJSON(), ["password", "email"]);
      });
      res.status(200).json(users2);
    } catch (error: any) {
      res.status(500).send({
        error: error.message,
      });
    }
  }
);

export default router;
