import { model, Schema } from "mongoose";
import bcrypt from "bcryptjs";
import { Document } from "mongoose";

const userModel = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    photo: {
      type: String,
      required: false,
      default: "",
    },
    role: {
      type: String,
      enum: ["admin", "seller", "buyer"],
    },
    commissionBalance: {
      type: Number,
      default: 0,
    },
    balance: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

export interface iUser extends Document {
  name: string;
  email: string;
  password: string;
  photo?: string;
  role: "admin" | "seller" | "buyer";
  commissionBalance: number;
  balance: number;
  checkPassword?: (password: string) => boolean;
}

const User = model<iUser>("User", userModel);
userModel.pre("save", function (next) {
  if (!this.isModified("password")) return next();
  this.password = bcrypt.hashSync(this.password, 10);
  next();
});
userModel.methods.checkPassword = function (password: string) {
  return bcrypt.compareSync(password.trim(), this.password);
};

export const createUser = async ({
  name,
  email,
  password,
  role,
}: {
  name: string;
  email: string;
  password: string;
  role?: "buyer" | "seller" | "admin";
}) => {
  const hashedPassword = await bcrypt.hash(password, 10);

  return await User.create({
    name,
    email,
    password: hashedPassword,
    role,
  });
};

export const findUserByEmail = async (email: string) => {
  return await User.findOne({ email });
};
export const findUserById = async (id: string) => {
  return await User.findById(id);
};

export const findUser = async () => {
  return await User.find();
};

export const deleteUser = async (id: string) => {
  return await User.findByIdAndDelete(id);
};

export const findCommissionBalance = async (role: "admin") => {
  return await User.findOne({ role });
};

export default User;
