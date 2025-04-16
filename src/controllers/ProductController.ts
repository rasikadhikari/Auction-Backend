import { Request, Response } from "express";
import {
  createProduct,
  deleteProduct,
  findProduct,
  findProductById,
  findProductOfUser,
  updateProduct,
} from "../models/ProductModel";
import { AuthRequest } from "../Authenticator/auth";
import fs from "fs";
import path from "path";

export const getAllProduct = async (req: Request, res: Response) => {
  try {
    const product = await findProduct();
    if (!product) {
      res.status(404).json({ message: "product not found" });
    }
    res
      .status(200)
      .json({ message: "Product has been fetch successfully", product });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error, message: "internal server error" });
  }
};

export const getAllProductById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const product = await findProductById(id);
    if (!product) {
      res.status(404).json({ message: "product not found" });
    }
    res
      .status(200)
      .json({ message: "Product Id has been fetch successfully", product });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error, message: "internal server error" });
  }
};
export const getCreateProduct = async (req: Request, res: Response) => {
  try {
    const file = req.file;
    const imagePath = file ? file.path : "";
    const {
      user,
      title,
      description,
      category,
      commission,
      price,
      height,
      lengthPic,
      width,
      mediumused,
      weight,
      isVerify,
      soldPrice,
      isSoldout,
      userTo,
    } = req.body;
    const product = await createProduct({
      user,
      title,
      description,
      image: imagePath,
      category,
      commission,
      price,
      height,
      lengthPic,
      width,
      mediumused,
      weight,
      isVerify,
      isSoldout,
      soldPrice,
      userTo,
    });
    if (!user || !title || !description || !category || !price || !userTo) {
      res.status(400).json({ message: "Missing required fields." });
      return;
    }
    res
      .status(200)
      .json({ message: "Product has been created successfully", product });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getDeleteProduct = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const product = await findProductById(id);

    if (!product) {
      res.status(400).json({ message: "product not found" });
    }

    if (!product || product.user.toString() !== req.user?.id) {
      res.status(403).json({
        message: "You are not authorized to delete this product",
      });
      return;
    }

    // Delete image file if it exists
    if (product.image) {
      const imagePath = path.resolve(product.image); // Resolves to absolute path
      fs.unlink(imagePath, (err) => {
        if (err) {
          console.error("Failed to delete image:", err.message);
        } else {
          console.log("Image file deleted:", imagePath);
        }
      });
    }
    const deleteProducts = await deleteProduct(id);
    res.status(200).json({
      message: "Product has been deleted successfully",
      product: deleteProducts,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getUpdateProduct = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.body) {
      res.status(400).json({ message: "Missing request body" });
      return;
    }
    const { id } = req.params;
    const file = req.file;
    const imagePath = file ? file.path : "";
    const {
      user,
      title,
      description,
      category,
      commission,
      price,
      height,
      lengthPic,
      width,
      mediumused,
      weight,
      isVerify,
      isSoldout,
      soldPrice,
      userTo,
    } = req.body;
    if (!user || !title || !description || !category || !price || !userTo) {
      // Clean up uploaded image if request is invalid
      if (imagePath) {
        fs.unlink(imagePath, (err) => {
          if (err)
            console.error("Failed to delete uploaded image:", err.message);
        });
      }
      res.status(400).json({ message: "Missing required fields." });
      return;
    }
    const product = await findProductById(id);

    if (!product) {
      res.status(400).json({ message: "product not found" });
    }
    const productUserId =
      product &&
      typeof product.user === "object" &&
      product.user !== null &&
      "id" in product.user
        ? product.user.id
        : product?.user?.toString();

    if (productUserId !== req.user?.id) {
      res.status(403).json({
        message: "You are not authorized to update this product",
      });
      if (product) {
        console.log("Product User ID:", product.user.toString());
      } else {
        console.log("Product is null");
      }
      return;
    }

    const updatedProduct = await updateProduct(id, {
      user,
      title,
      description,
      image: imagePath || (product ? product.image : ""),
      category,
      commission,
      price,
      height,
      lengthPic,
      width,
      mediumused,
      weight,
      isVerify,
      isSoldout,
      soldPrice,
      userTo,
    });

    res.status(200).json({
      message: "Product has been updated successfully",
      product: updatedProduct,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const getProductOfUser = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      res.status(400).json({ message: "User ID is required" });
      return;
    }

    const products = await findProductOfUser(userId);

    if (!products || products.length === 0) {
      res.status(404).json({ message: "Products not found" });
      return;
    }

    res.status(200).json({
      message: "Product has been fetch successfully",
      products,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getVerifyAndAddCommissionByAdmin = async (
  req: Request,
  res: Response
) => {
  try {
    const { commission } = req.body;
    const { id } = req.params;
    const product = await findProductById(id);
    if (!product) {
      res.status(404).json({ message: "Product not found" });
    }
    if (product) {
      product.isVerify = true;
    }
    if (product) {
      product.commission = commission;
    }
    await product?.save();
    res.status(200).json({
      message: "Product has been updated successfully",
      product,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Internal server error" });
  }
};
