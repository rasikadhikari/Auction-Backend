import { Request, Response } from "express";
import Product, {
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
import Category from "../models/CategoryModel";

export const getAllProduct = async (req: Request, res: Response) => {
  try {
    const { category, isVerify, isSoldout, min, max, status } = req.query;

    const filter: any = {};

    if (category) {
      filter.category = category;
    }

    if (isVerify !== undefined) {
      filter.isVerify = isVerify === "true";
    }

    if (isSoldout !== undefined) {
      filter.isSoldout = isSoldout === "true";
    }

    if (status) {
      filter.status = status;
    }

    if (min || max) {
      filter.price = {};
      if (min) filter.price.$gte = Number(min);
      if (max) filter.price.$lte = Number(max);
    }

    const products = await Product.find(filter)
      .populate("user")
      .populate("userTo")
      .populate("category", "title");

    if (!products || products.length === 0) {
      res.status(404).json({ message: "No products found" });
      return;
    }

    res.status(200).json({
      message: "Products fetched successfully",
      products,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error, message: "Internal server error" });
    return;
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
export const getCreateProduct = async (req: AuthRequest, res: Response) => {
  try {
    const file = req.file;
    const userId = req.user?.id;
    const imagePath = file ? `/uploads/${file.filename}` : "";
    const {
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
    } = req.body;

    const categoryTitle = category;
    const categoryDoc = await Category.findOne({ title: categoryTitle });
    if (!categoryDoc) {
      res.status(400).json({ message: "Category not found." });
      return;
    }
    if (!title || !description || !category || !price) {
      res.status(400).json({ message: "Missing required fields." });
      return;
    }
    const product = await createProduct({
      user: userId!,
      title,
      description,
      image: imagePath,
      category: categoryDoc._id as string,
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
    });

    res
      .status(200)
      .json({ message: "Product has been created successfully", product });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getDeleteProduct = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const product = await findProductById(id);

    if (!product) {
      res.status(400).json({ message: "Product not found" });
      return;
    }

    const isAdmin = req.user?.role?.toLowerCase() === "admin";
    const isSeller = req.user?.role?.toLowerCase() === "seller";

    const isOwner = product.user.toString() === req.user?.id;

    if (!isAdmin && !isOwner && !isSeller) {
      res.status(403).json({
        message: "You are not authorized to delete this product",
      });
      return;
    }

    if (product.image) {
      const imagePath = path.resolve(
        __dirname,
        "..",
        "uploads",
        product.image.replace(/^\/+/, "")
      );
      console.log("Resolved Image Path:", imagePath);

      fs.access(imagePath, fs.constants.F_OK, (err) => {
        if (err) {
          console.error("Image does not exist at:", imagePath);
        } else {
          fs.unlink(imagePath, (err) => {
            if (err) {
              console.error("Failed to delete image:", err.message);
            } else {
              console.log("Image deleted successfully:", imagePath);
            }
          });
        }
      });
    }

    const deletedProduct = await deleteProduct(id);
    res.status(200).json({
      message: "Product has been deleted successfully",
      product: deletedProduct,
    });
  } catch (err) {
    console.error(err);
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
    const imagePath = file ? `/uploads/${file.filename}` : "";

    const {
      user,
      title,
      description,
      category,
      price,
      height,
      lengthPic,
      width,
      mediumused,
      weight,
    } = req.body;

    // Validate required fields
    if (!user || !title || !description || !category || !price) {
      if (imagePath) {
        fs.unlink(path.resolve(__dirname, "..", imagePath), (err) => {
          if (err)
            console.error("Failed to delete uploaded image:", err.message);
        });
      }
      res.status(400).json({ message: "Missing required fields." });
      return;
    }

    const categoryDoc = await Category.findOne({ title: category });
    if (!categoryDoc) {
      if (imagePath) {
        fs.unlink(path.resolve(__dirname, "..", imagePath), (err) => {
          if (err)
            console.error("Failed to delete uploaded image:", err.message);
        });
      }
      res.status(400).json({ message: "Invalid category provided." });
      return;
    }

    // Find the product
    const product = await findProductById(id);
    if (!product) {
      res.status(400).json({ message: "Product not found" });
      return;
    }

    // Check if current user is authorized
    const productUserId =
      typeof product.user === "object" &&
      product.user !== null &&
      "id" in product.user
        ? product.user.id
        : (product?.user as string)?.toString();

    if (productUserId !== req.user?.id) {
      if (imagePath) {
        fs.unlink(path.resolve(__dirname, "..", imagePath), (err) => {
          if (err)
            console.error("Failed to delete uploaded image:", err.message);
        });
      }
      res
        .status(403)
        .json({ message: "You are not authorized to update this product" });
      return;
    }

    // Update product
    const updatedProduct = await updateProduct(id, {
      user,
      title,
      description,
      image: imagePath || product.image,
      category: categoryDoc._id as string,
      price,
      height,
      lengthPic,
      width,
      mediumused,
      weight,
    });

    res.status(200).json({
      message: "Product has been updated successfully",
      product: updatedProduct,
    });
  } catch (err) {
    console.error("Update product error:", err);
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

    if (commission === undefined || commission < 0) {
      res
        .status(400)
        .json({ message: "Commission must be a non-negative number." });
    }

    const product = await findProductById(id);

    if (!product) {
      res.status(404).json({ message: "Product not found" });
      return;
    }

    if (product.isVerify) {
      res.status(400).json({ message: "Product is already verified" });
      return;
    }
    product.isVerify = true;
    product.commission = commission;

    // 4. Save product
    await product.save();

    res.status(200).json({
      message: "Product has been verified and commission added successfully",
      product,
    });
  } catch (err) {
    console.error("Error verifying product and adding commission:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const assignBuyerToProduct = async (req: Request, res: Response) => {
  const { productId, buyerId } = req.body;

  const updatedProduct = await Product.findByIdAndUpdate(
    productId,
    { userTo: buyerId, isSoldout: true },
    { new: true }
  );

  res.status(200).json({ message: "Buyer assigned", product: updatedProduct });
};

export const getProductsByCreatorRole = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const role = req.params.role;
    if (!["admin", "seller"].includes(role)) {
      res.status(400).json({ message: "Invalid role specified" });
      return;
    }

    const products = await Product.find()
      .populate("user")
      .populate("userTo")
      .sort("-createdAt");

    const filtered = products.filter((p: any) => p.user?.role === role);

    res.status(200).json({ products: filtered });
    return;
  } catch (error) {
    console.error("Error fetching products by role:", error);
    res.status(500).json({ message: "Server error" });
    return;
  }
};
