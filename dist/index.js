"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const mongoose_1 = __importDefault(require("mongoose"));
const userRoute_1 = __importDefault(require("./routes/userRoute"));
const postRoute_1 = __importDefault(require("./routes/postRoute"));
const dotenv_1 = __importDefault(require("dotenv"));
const cors_1 = __importDefault(require("cors"));
const db_1 = __importDefault(require("./config/db"));
const app = (0, express_1.default)();
app.use(express_1.default.json());
app.use((0, cors_1.default)());
app.use(express_1.default.urlencoded({ extended: true }));
app.use("/api/users", userRoute_1.default);
app.use("/api/posts", postRoute_1.default);
app.use("/images", express_1.default.static("public/images"));
(0, db_1.default)();
app.get("/", (request, response) => {
    response.send("Hello world");
});
app.get("/ip", (request, response) => response.send(request.ip));
app.set("trust proxy", 1);
dotenv_1.default.config();
const PORT = process.env.PORT || 8000;
const MONGO_URL = process.env.MONGO_URL;
app.listen(PORT, () => {
    mongoose_1.default.connect(MONGO_URL, () => {
        console.log("Connected", PORT);
    });
});
