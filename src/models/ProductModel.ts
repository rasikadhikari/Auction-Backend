import mongoose, { model, Schema } from "mongoose";
const productModel = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    image: {
      type: String,
      default: "",
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },

    commission: {
      type: Number,
      default: 0,
    },
    price: {
      type: Number,
      required: true,
    },
    height: { type: Number },
    lengthPic: { type: Number },
    width: { type: Number },
    mediumused: { type: String },
    weight: { type: Number },
    isVerify: { type: Boolean, default: false },
    isSoldout: { type: Boolean, default: false },
    soldPrice: { type: Number, default: 0 },
    userTo: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

const Product = model("Product", productModel);

type ProductInput = {
  user: string;
  title: string;
  description: string;
  image?: string;
  category: string;
  commission?: number;
  price: number;
  height?: number;
  lengthPic?: number;
  width?: number;
  mediumused?: string;
  weight?: number;
  isVerify?: boolean;
  isSoldout?: boolean;
  soldPrice?: number;
  userTo?: string;
};

export const findProduct = async () => {
  return await Product.find().populate("user").populate("userTo");
};
export const findProductById = async (id: string) => {
  return await Product.findById(id).populate("user").populate("userTo");
};
export const createProduct = async (data: ProductInput) => {
  return await Product.create(data);
};
export const updateProduct = async (id: string, data: ProductInput) => {
  return await Product.findByIdAndUpdate(id, data, { new: true })
    .populate("user")
    .populate("userTo");
};
export const deleteProduct = async (id: string) => {
  return await Product.findByIdAndDelete(id);
};

export const findProductOfUser = async (userId: string) => {
  return await Product.find({ user: userId })
    .populate("user")
    .populate("userTo")
    .sort("-createdAt");
};

export default Product;
