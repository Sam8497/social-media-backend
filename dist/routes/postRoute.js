"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const express_validator_1 = require("express-validator");
const lodash_1 = require("lodash");
const isAuthenticated_1 = __importDefault(require("../middlewares/isAuthenticated"));
const postModel_1 = __importDefault(require("../models/postModel"));
const userModel_1 = __importDefault(require("../models/userModel"));
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const uuid_1 = require("uuid");
const express_rate_limit_1 = require("express-rate-limit");
const router = express_1.default.Router();
const createPostLimit = (0, express_rate_limit_1.rateLimit)({
    windowMs: 20 * 60 * 1000,
    max: 1,
    message: {
        error: "You can create only 1 posts in 15 minutes.:)",
    },
    statusCode: 200,
});
const storage = multer_1.default.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "../public/images/");
    },
    filename: function (req, file, cb) {
        cb(null, (0, uuid_1.v4)() + "-" + Date.now() + path_1.default.extname(file.originalname));
    },
});
const fileFilter = (req, file, cb) => {
    const allowedFileTypes = [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/gif",
    ];
    if (allowedFileTypes.includes(file.mimetype)) {
        cb(null, true);
    }
    else {
        cb(null, false);
    }
};
const upload = (0, multer_1.default)({
    storage: storage,
    limits: { fileSize: 1024 * 1024 * 3 },
    fileFilter: fileFilter,
});
//get all posts
router.get("/", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const posts = yield postModel_1.default.find().sort({ createdAt: -1 });
        res.status(200).json(posts);
    }
    catch (error) {
        res.status(500).send({
            error: error.message,
        });
    }
}));
//create post
router.post("/", upload.single("image"), createPostLimit, isAuthenticated_1.default, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const { caption } = req.body;
    const image = (_a = req === null || req === void 0 ? void 0 : req.file) === null || _a === void 0 ? void 0 : _a.filename;
    const userId = res.locals.user._id;
    const data = {
        caption,
        image,
        userId,
    };
    try {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            res.status(400).json({
                error: errors.array()[0].msg,
            });
        }
        const postboi = new postModel_1.default(data);
        yield postboi.save();
        const posts = yield postModel_1.default.find().sort({ createdAt: -1 });
        res.status(200).json(posts);
    }
    catch (error) {
        res.status(500).send({
            error: error.message,
        });
    }
}));
//get user posts by id
router.get("/userposts/:userId", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { userId } = req.params;
    try {
        const posts = yield postModel_1.default.find({ userId: userId });
        res.status(200).json(posts);
    }
    catch (error) {
        res.status(500).send({
            error: error.message,
        });
    }
}));
//like post
router.put("/like/:postId", isAuthenticated_1.default, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { postId } = req.params;
    const userId = res.locals.user._id;
    try {
        const post = yield postModel_1.default.findById(postId);
        if (post.likes.includes(userId)) {
            yield post.updateOne({
                $pull: { likes: userId },
            });
            const newpost1 = yield postModel_1.default.find().sort({ createdAt: -1 });
            res.json(newpost1);
        }
        else {
            yield post.updateOne({
                $push: { likes: userId },
            });
            const newpost2 = yield postModel_1.default.find().sort({ createdAt: -1 });
            res.json(newpost2);
        }
    }
    catch (error) {
        res.status(500).send({
            error: error.message,
        });
    }
}));
//trending posts
router.get("/trending", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const postsStuff = yield postModel_1.default.find()
            .sort({
            likes: -1,
        })
            .limit(5);
        res.json(postsStuff);
    }
    catch (error) {
        res.status(500).send({
            error: error.message,
        });
    }
}));
//get post by id
router.get("/:postId", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { postId } = req.params;
    try {
        const post = yield postModel_1.default.findById(postId);
        res.status(200).json(post);
    }
    catch (error) {
        res.status(500).send({
            error: error.message,
        });
    }
}));
//delete post
router.delete("/:postId", isAuthenticated_1.default, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { postId } = req.params;
    try {
        const post = yield postModel_1.default.findById(postId);
        if (post.userId === res.locals.user._id) {
            yield postModel_1.default.findByIdAndDelete(postId);
            const posts = yield postModel_1.default.find().sort({ createdAt: -1 });
            res.status(200).json(posts);
        }
        else {
            res.status(403).send({
                error: "You can't delete other posts",
            });
        }
    }
    catch (error) {
        res.status(500).send({
            error: error.message,
        });
    }
}));
//update post
router.put("/:postId", upload.single("image"), isAuthenticated_1.default, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _b;
    const userId = res.locals.user._id;
    const { caption } = req.body;
    const image = (_b = req === null || req === void 0 ? void 0 : req.file) === null || _b === void 0 ? void 0 : _b.filename;
    const postId = req.params.postId;
    const data = {
        caption,
        image,
    };
    try {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            res.status(400).json({
                error: errors.array()[0].msg,
            });
        }
        const post = yield postModel_1.default.findById(postId);
        if ((post === null || post === void 0 ? void 0 : post.userId) === userId) {
            yield postModel_1.default.findByIdAndUpdate(postId, data);
            const posts = yield postModel_1.default.find().sort({ createdAt: -1 });
            res.json(posts);
        }
        else {
            res.json({
                error: "You cant update other posts :)",
            });
        }
    }
    catch (error) {
        res.json({
            error: error.message,
        });
    }
}));
//comment on a post
router.post("/:postId/comment", (0, express_validator_1.body)("comment").exists().withMessage("comment is required"), isAuthenticated_1.default, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { postId } = req.params;
    const userId = res.locals.user._id;
    const comment = req.body.comment;
    try {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            res.status(400).json({
                error: errors.array()[0].msg,
            });
        }
        else {
            const post = yield postModel_1.default.findById(postId);
            const user = yield userModel_1.default.findById(userId);
            const userboi = (0, lodash_1.omit)(user === null || user === void 0 ? void 0 : user.toJSON(), [
                "password",
                "email",
                "following",
                "followers",
                "bio",
                "createdAt",
                "updatedAt",
            ]);
            yield post.updateOne({
                $push: {
                    comments: {
                        userboi,
                        comment,
                    },
                },
            });
            const posts = yield postModel_1.default.find().sort({ createdAt: -1 });
            res.status(200).json(posts);
        }
    }
    catch (error) {
        res.status(500).send({
            error: error.message,
        });
    }
}));
//search posts
router.get(`/search/:postname`, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const postboi = new RegExp(req.params.postname, "i");
        const posts = yield postModel_1.default.find({
            caption: postboi,
        });
        res.json(posts);
    }
    catch (err) {
        res.json({
            error: err.message,
        });
    }
}));
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
exports.default = router;
