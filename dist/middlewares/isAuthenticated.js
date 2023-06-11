"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const isAuthenticated = (req, res, next) => {
    const authHeader = req.headers.token;
    if (authHeader) {
        try {
            const decoded = jsonwebtoken_1.default.verify(authHeader, process.env.JWT_SECRET);
            // @ts-ignore
            res.locals.user = decoded.user;
            next();
        }
        catch (error) {
            res.json({
                error: error.message,
            });
        }
    }
    else {
        res.status(401).send("Unauthorized");
    }
};
exports.default = isAuthenticated;
