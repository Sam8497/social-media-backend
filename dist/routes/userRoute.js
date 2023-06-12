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
const userModel_1 = __importDefault(require("../models/userModel"));
const lodash_1 = require("lodash");
const bcrypt_1 = __importDefault(require("bcrypt"));
const multer_1 = __importDefault(require("multer"));
const uuid_1 = require("uuid");
const path_1 = __importDefault(require("path"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const isAuthenticated_1 = __importDefault(require("../middlewares/isAuthenticated"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const createUserLimiter = (0, express_rate_limit_1.default)({
    windowMs: 60 * 60 * 1000,
    max: 2,
    message: {
        error: "You can create only 2 accounts in 1 hour.",
    },
    statusCode: 200,
});
const router = express_1.default.Router();
const storage = multer_1.default.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "public/images");
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
//register
router.post("/register", 
// upload.single("image"),
(0, express_validator_1.body)("username")
    .exists()
    .withMessage("username is required")
    .isLength({
    min: 4,
    max: 20,
})
    .withMessage("username must be between 4 and 20 characters"), (0, express_validator_1.body)("email")
    .exists()
    .withMessage("email is required")
    .isEmail()
    .withMessage("email must be valid"), (0, express_validator_1.body)("password")
    .exists()
    .withMessage("password is required")
    .isLength({
    min: 8,
    max: 20,
})
    .withMessage("password must be between 8 and 20 characters")
    .matches(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[^a-zA-Z0-9]).{8,}$/, "i")
    .withMessage("Password should be combination of one uppercase,one lower case,one special char and one digit"), createUserLimiter, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { username, email, password } = req.body;
    // const image = req?.file?.filename;
    try {
        const userbyemail = yield userModel_1.default.findOne({ email });
        const userbyusername = yield userModel_1.default.findOne({ username });
        if (userbyemail || userbyusername) {
            res.json({
                error: "username or email already exists",
            });
        }
        else {
            const errors = (0, express_validator_1.validationResult)(req);
            if (!errors.isEmpty()) {
                res.json({
                    error: errors.array()[0].msg,
                });
            }
            else {
                const userboi = yield userModel_1.default.create({
                    username: username,
                    email: email,
                    password: password,
                    // image: image,
                });
                const userboi2 = (0, lodash_1.omit)(userboi.toJSON(), ["password", "email"]);
                res.status(201).json(userboi2);
            }
        }
    }
    catch (error) {
        res.send({
            error: error.message,
        });
    }
}));
//login
router.post("/login", (0, express_validator_1.body)("email")
    .exists()
    .withMessage("email is required")
    .isEmail()
    .withMessage("email must be valid"), (0, express_validator_1.body)("password")
    .exists()
    .withMessage("password is required")
    .isLength({
    min: 8,
    max: 20,
})
    .withMessage("password must be between 8 and 20 characters"), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            res.json({
                error: errors.array()[0].msg,
            });
        }
        else {
            const { email, password } = req.body;
            const user = yield userModel_1.default.findOne({ email });
            if (!user) {
                res.json({
                    error: "Invalid credentials",
                });
            }
            else {
                const hashedpass = yield bcrypt_1.default.compare(password, user.password);
                if (!hashedpass) {
                    res.json({
                        error: "Invalid credentials",
                    });
                }
                else {
                    const userboi = (0, lodash_1.omit)(user.toJSON(), ["password", "email"]);
                    const token = jsonwebtoken_1.default.sign({
                        user: userboi,
                    }, process.env.JWT_SECRET, {
                        expiresIn: "69h", // :)
                    });
                    res.status(200).json({
                        token: token,
                    });
                }
            }
        }
    }
    catch (error) {
        res.send({
            error: error.message,
        });
    }
}));
//update profile
router.put("/update_profile", 
// upload.single("image"),
(0, express_validator_1.body)("username")
    .exists()
    .withMessage("username is required")
    .isLength({
    min: 4,
    max: 20,
})
    .withMessage("username must be between 4 and 20 characters"), (0, express_validator_1.body)("email")
    .exists()
    .withMessage("email is required")
    .isEmail()
    .withMessage("email must be valid"), isAuthenticated_1.default, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { username, email, bio } = req.body;
    // const image = req?.file?.filename;
    const userId = res.locals.user._id;
    try {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            res.json({
                error: errors.array()[0].msg,
            });
        }
        else {
            yield userModel_1.default.findByIdAndUpdate(userId, {
                username: username,
                email: email,
                bio: bio,
                // image: image,
            });
            const userboi = yield userModel_1.default.findById(userId);
            const userboi2 = (0, lodash_1.omit)(userboi === null || userboi === void 0 ? void 0 : userboi.toJSON(), ["password", "email"]);
            res.status(200).json(userboi2);
        }
    }
    catch (error) {
        res.send({
            error: error.message,
        });
    }
}));
//get user by id
router.get("/getbyid/:userId", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { userId } = req.params;
    try {
        const userboi = yield userModel_1.default.findById(userId);
        const userboi2 = (0, lodash_1.omit)(userboi === null || userboi === void 0 ? void 0 : userboi.toJSON(), ["password", "email"]);
        res.status(200).json(userboi2);
    }
    catch (error) {
        res.send({
            error: "user not found",
        });
    }
}));
//folllow user
router.put("/follow/:userId", isAuthenticated_1.default, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { userId } = req.params;
    const currentuserId = res.locals.user._id;
    try {
        const user = yield userModel_1.default.findById(userId);
        const currentuser = yield userModel_1.default.findById(currentuserId);
        if (userId === currentuserId) {
            res.json({
                error: "You can't follow yourself",
            });
        }
        else {
            if (!(user === null || user === void 0 ? void 0 : user.followers.includes(currentuserId))) {
                yield (user === null || user === void 0 ? void 0 : user.updateOne({
                    $push: {
                        followers: currentuserId,
                    },
                }));
                yield (currentuser === null || currentuser === void 0 ? void 0 : currentuser.updateOne({
                    $push: {
                        following: userId,
                    },
                }));
                const userboi = yield userModel_1.default.findById(userId);
                const userboi2 = (0, lodash_1.omit)(userboi === null || userboi === void 0 ? void 0 : userboi.toJSON(), "password");
                res.status(200).json(userboi2);
            }
            else {
                yield (user === null || user === void 0 ? void 0 : user.updateOne({
                    $pull: {
                        followers: currentuserId,
                    },
                }));
                yield (currentuser === null || currentuser === void 0 ? void 0 : currentuser.updateOne({
                    $pull: {
                        following: userId,
                    },
                }));
                const userboi3 = yield userModel_1.default.findById(userId);
                const userboi4 = (0, lodash_1.omit)(userboi3 === null || userboi3 === void 0 ? void 0 : userboi3.toJSON(), "password");
                res.status(200).json(userboi4);
            }
        }
    }
    catch (error) {
        res.send({
            error: error.message,
        });
    }
}));
//who to follow
router.get("/whotofollow", isAuthenticated_1.default, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const currentuserId = res.locals.user._id;
    try {
        const users = yield userModel_1.default.find({
            _id: {
                $nin: [currentuserId],
            },
        })
            .sort({
            createdAt: -1,
        })
            .limit(3);
        const users2 = users.map((user) => {
            return (0, lodash_1.omit)(user.toJSON(), ["password", "email"]);
        });
        res.status(200).json(users2);
    }
    catch (error) {
        res.status(500).send({
            error: error.message,
        });
    }
}));
exports.default = router;
