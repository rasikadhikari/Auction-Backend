import mongoose, { Schema, Types, model } from "mongoose";
import { Document } from "mongoose";
export interface ICategory extends Document {
  user: Types.ObjectId;
  title: string;
}
const categorySchema = new Schema<ICategory>(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

const Category = model<ICategory>("Category", categorySchema);

export const findCategory = async () => {
  return await Category.find().populate("user").sort("-createdAt");
};
export const findCategoryById = async (id: string) => {
  return await Category.findById(id).populate("user");
};
export const createCategory = async (data: ICategory) => {
  return await Category.create(data);
};
export const updateCategory = async (id: string, data: ICategory) => {
  return await Category.findByIdAndUpdate(id, data);
};
export const deleteCategory = async (id: string) => {
  return await Category.findByIdAndDelete(id);
};

export const findTitle = async (title: string) => {
  return await Category.findOne({ title });
};

export default Category;
