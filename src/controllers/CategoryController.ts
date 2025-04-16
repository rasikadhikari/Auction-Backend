import { Request, Response } from "express";
import {
  createCategory,
  deleteCategory,
  findCategory,
  findCategoryById,
  findTitle,
  updateCategory,
} from "../models/CategoryModel";
import { AuthRequest } from "../Authenticator/auth";
import { ICategory } from "../models/CategoryModel";
import mongoose from "mongoose";

export const getCreateCategory = async (req: AuthRequest, res: Response) => {
  try {
    const { title } = req.body;
    const userId = req.user?.id;
    console.log(userId);

    if (!userId) {
      res.status(400).json({ message: "Unauthorized to create" });
    }

    const activeCategory = await findTitle(title);
    if (activeCategory) {
      res
        .status(400)
        .json({ message: "Category with this title already exists" });
    }

    const categoryData: Partial<ICategory> = {
      title,
      user: new mongoose.Types.ObjectId(userId),
    };
    const category = await createCategory(categoryData as ICategory);
    res
      .status(200)
      .json({ message: "Category created successfully", category });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "internal server error", err });
  }
};

export const getFindCategory = async (req: Request, res: Response) => {
  try {
    const category = await findCategory();

    res.status(200).json({ message: "Successfully fetch Category", category });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Internal server Error" });
  }
};

export const getUpdateCategory = async (req: AuthRequest, res: Response) => {
  try {
    const { title } = req.body;
    const { id } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const category = await findCategoryById(id);

    if (!category) {
      res.status(404).json({ message: "Category not found" });
      return;
    }

    if (category.user._id.toString() !== userId) {
      res.status(403).json({ message: "Forbidden: Access denied" });
      return;
    }

    const updated = await updateCategory(id, {
      title,
      user: new mongoose.Types.ObjectId(userId),
    } as ICategory);

    res
      .status(200)
      .json({ message: "Category updated successfully", category: updated });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Internal server error", err });
  }
};

export const getDeleteCategory = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const category = await findCategoryById(id);
    if (!category) {
      res.status(404).json({ message: "Category not found" });
      return;
    }

    if (category.user._id.toString() !== userId) {
      res.status(403).json({ message: "Forbidden: Access denied" });
      return;
    }

    await deleteCategory(id);
    res.status(200).json({ message: "Category deleted successfully" });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Internal server error", err });
  }
};
