"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const PostSchema = new mongoose_1.default.Schema({
    caption: {
        type: String,
        required: [true, "caption is required"],
        min: 5,
        max: 100,
    },
    image: {
        type: String,
        required: [true, "image is required"],
    },
    likes: {
        type: Array,
        default: [],
    },
    comments: {
        type: Array,
        default: [],
    },
    userId: {
        type: String,
        required: true,
    },
}, {
    timestamps: true,
});
const Post = mongoose_1.default.model("post", PostSchema);
exports.default = Post;
