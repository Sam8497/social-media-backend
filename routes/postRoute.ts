import express, { Response, Request, Router } from "express";
import { body, validationResult } from "express-validator";
import { omit } from "lodash";
import isAuthenticated from "../middlewares/isAuthenticated";
import Post from "../models/postModel";
import User from "../models/userModel";
import multer from "multer";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import { rateLimit } from "express-rate-limit";

const router: Router = express.Router();

const createPostLimit = rateLimit({
  windowMs: 20 * 60 * 1000,
  max: 1,
  message: {
    error:
      "You can create only 1 posts in 15 minutes.:)",
  },
  statusCode: 200,
});

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

//get all posts
router.get("/", async (req: Request, res: Response) => {
  try {
    const posts = await Post.find().sort({ createdAt: -1 });
    res.status(200).json(posts);
  } catch (error: any) {
    res.status(500).send({
      error: error.message,
    });
  }
});

//create post
router.post(
  "/",
  upload.single("image"),
  createPostLimit,
  isAuthenticated,
  async (req: Request, res: Response) => {
    const { caption } = req.body;
    const image = req?.file?.filename;
    const userId = res.locals.user._id;
    const data = {
      caption,
      image,
      userId,
    };
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          error: errors.array()[0].msg,
        });
      }
      const postboi = new Post(data);
      await postboi.save();
      const posts = await Post.find().sort({ createdAt: -1 });
      res.status(200).json(posts);
    } catch (error: any) {
      res.status(500).send({
        error: error.message,
      });
    }
  }
);

//get user posts by id
router.get("/userposts/:userId", async (req: Request, res: Response) => {
  const { userId } = req.params;
  try {
    const posts = await Post.find({ userId: userId });
    res.status(200).json(posts);
  } catch (error: any) {
    res.status(500).send({
      error: error.message,
    });
  }
});

//like post
router.put(
  "/like/:postId",
  isAuthenticated,
  async (req: Request, res: Response) => {
    const { postId } = req.params;
    const userId = res.locals.user._id;
    try {
      const post = await Post.findById(postId);
      if (post.likes.includes(userId)) {
        await post.updateOne({
          $pull: { likes: userId },
        });
        const newpost1 = await Post.find().sort({ createdAt: -1 });
        res.json(newpost1);
      } else {
        await post.updateOne({
          $push: { likes: userId },
        });
        const newpost2 = await Post.find().sort({ createdAt: -1 });
        res.json(newpost2);
      }
    } catch (error: any) {
      res.status(500).send({
        error: error.message,
      });
    }
  }
);

//trending posts
router.get("/trending", async (req, res) => {
  try {
    const postsStuff = await Post.find()
      .sort({
        likes: -1,
      })
      .limit(5);
    res.json(postsStuff);
  } catch (error: any) {
    res.status(500).send({
      error: error.message,
    });
  }
});

//get post by id
router.get("/:postId", async (req: Request, res: Response) => {
  const { postId } = req.params;
  try {
    const post = await Post.findById(postId);
    res.status(200).json(post);
  } catch (error: any) {
    res.status(500).send({
      error: error.message,
    });
  }
});

//delete post
router.delete(
  "/:postId",
  isAuthenticated,
  async (req: Request, res: Response) => {
    const { postId } = req.params;
    try {
      const post = await Post.findById(postId);
      if (post.userId === res.locals.user._id) {
        await Post.findByIdAndDelete(postId);
        const posts = await Post.find().sort({ createdAt: -1 });
        res.status(200).json(posts);
      } else {
        res.status(403).send({
          error: "You can't delete other posts",
        });
      }
    } catch (error: any) {
      res.status(500).send({
        error: error.message,
      });
    }
  }
);

//update post
router.put(
  "/:postId",
  upload.single("image"),
  isAuthenticated,
  async (req, res) => {
    const userId = res.locals.user._id;
    const { caption } = req.body;
    const image = req?.file?.filename;
    const postId = req.params.postId;
    const data = {
      caption,
      image,
    };
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          error: errors.array()[0].msg,
        });
      }
      const post = await Post.findById(postId);
      if (post?.userId === userId) {
        await Post.findByIdAndUpdate(postId, data);
        const posts = await Post.find().sort({ createdAt: -1 });
        res.json(posts);
      } else {
        res.json({
          error: "You cant update other posts :)",
        });
      }
    } catch (error: any) {
      res.json({
        error: error.message,
      });
    }
  }
);

//comment on a post
router.post(
  "/:postId/comment",
  body("comment").exists().withMessage("comment is required"),
  isAuthenticated,
  async (req: Request, res: Response) => {
    const { postId } = req.params;
    const userId = res.locals.user._id;
    const comment = req.body.comment;
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          error: errors.array()[0].msg,
        });
      } else {
        const post = await Post.findById(postId);
        const user = await User.findById(userId);
        const userboi = omit(user?.toJSON(), [
          "password",
          "email",
          "following",
          "followers",
          "bio",
          "createdAt",
          "updatedAt",
        ]);
        await post.updateOne({
          $push: {
            comments: {
              userboi,
              comment,
            },
          },
        });
        const posts = await Post.find().sort({ createdAt: -1 });
        res.status(200).json(posts);
      }
    } catch (error: any) {
      res.status(500).send({
        error: error.message,
      });
    }
  }
);

//search posts
router.get(`/search/:postname`, async (req, res) => {
  try {
    const postboi = new RegExp(req.params.postname, "i");
    const posts = await Post.find({
      caption: postboi,
    });
    res.json(posts);
  } catch (err: any) {
    res.json({
      error: err.message,
    });
  }
});

//delete a user all posts
// router.delete("/delete/:userid", async (req, res) => {
//   try {
//     const posts = await Post.find({ userId: req.params.userid }).deleteMany()
//     res.json("deleted")
//   } catch (error: any) {
//     res.status(500).send({
//       error: error.message,
//     });
//   }
// })

// User.insertMany(users);
// Post.insertMany(posts);

export default router;
