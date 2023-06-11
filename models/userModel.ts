import mongoose, { Schema } from "mongoose";
import bcrypt from "bcrypt";

export interface UserModel extends mongoose.Document {
  username: string;
  email: string;
  password: string;
  // image: string;
  bio: string;
  followers: [];
  following: [];
}

const UserSchema: Schema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, "username is required"],
      unique: [true, "username is already taken"],
    },
    email: {
      type: String,
      required: [true, "email is required"],
      unique: [true, "email already taken"],
    },
    password: {
      type: String,
      min: 6,
      max: 14,
      required: [true, "password is required"],
    },
    // image: {
    //   type: String,
    //   required: [true, "image is required"],
    // },
    bio: {
      type: String,
      default: "Social-meadia Connects People",
      min: 5,
      max: 100,
    },
    followers: {
      type: Array,
      default: [],
    },
    following: {
      type: Array,
      default: [],
    },
  },
  { timestamps: true }
);

UserSchema.pre("save", async function (next) {
  let user = this as UserModel;

  if (!user.isModified("password")) {
    return next();
  }

  const salt = await bcrypt.genSalt(10);

  const hash = await bcrypt.hashSync(user.password, salt);

  user.password = hash;

  return next();
});

const User = mongoose.model<UserModel>("user", UserSchema);

export default User;
