import { Request, Response } from "express";
import {
  createUser,
  deleteUser,
  findCommissionBalance,
  findUser,
  findUserByEmail,
  findUserById,
} from "../models/UserModel";
import bcrypt from "bcrypt";
import Jwt from "jsonwebtoken";
import { validationResult } from "express-validator";
import { AuthRequest } from "../Authenticator/auth";
import Product from "../models/ProductModel";
import Bidding from "../models/BiddingModel";
import Wishlist from "../models/WishlistModel";

export const registerUser = async (req: Request, res: Response) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password || !role) {
      res.status(400).json({ message: "Some credentials are missing" });
      return;
    }

    const existingUser = await findUserByEmail(email);
    if (existingUser) {
      res.status(400).json({ message: "Email has already been used" });
      return;
    }

    const newUser = await createUser({ name, email, password, role });
    if (!newUser) {
      res.status(500).json({ message: "User could not be created" });
      return;
    }

    res.status(201).json({
      message: "User registered successfully",
      user: newUser,
    });
  } catch (err) {
    console.error("Error in registering --", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getAllUser = async (req: Request, res: Response) => {
  try {
    const users = await findUser();
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};

export const loginUser = async (req: Request, res: Response) => {
  try {
    const result = validationResult(req);
    if (!result.isEmpty()) {
      res.status(400).json({ message: "Invalid credentials" });
      return;
    }

    const { email, password, role } = req.body;

    if (!email || !password || !role) {
      res
        .status(400)
        .json({ message: "Email, password, and role are required" });
      return;
    }

    const existingUser = await findUserByEmail(email);
    if (!existingUser) {
      res.status(400).json({ message: "Email or password is incorrect" });
      return;
    }

    if (existingUser.role !== role) {
      res.status(403).json({ message: `You are not registered as a ${role}` });
      return;
    }

    const isPasswordValid = await bcrypt.compare(
      password,
      existingUser.password
    );
    if (!isPasswordValid) {
      res.status(400).json({ message: "Email or password is incorrect" });
      return;
    }

    const token = Jwt.sign(
      {
        id: existingUser._id,
        role: existingUser.role,
        email: existingUser.email,
        name: existingUser.name,
      },
      "secret",
      {
        expiresIn: "48h",
      }
    );

    res.status(200).json({
      message: `Login successful as ${role}`,
      token,
      user: existingUser,
    });
  } catch (err) {
    console.error("Error in logging in --", err);
    res.status(500).json({ message: "Internal server error" });
  }
};
export const getDeleteUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const response = await deleteUser(id);
    res.status(200).json({
      message: "User deleted successfully",
      response,
    });
  } catch (err) {
    console.error("Error in deleting user --", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getUserBalance = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = await findUserById(id);
    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }
    res.status(200).json({
      message: "User balance fetched successfully",
      balance: user.balance,
    });
  } catch (err) {
    console.error("Error in fetching user balance --", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const estimatedCommission = async (req: AuthRequest, res: Response) => {
  try {
    const { role } = req.user!;

    if (role !== "admin") {
      res.status(403).json({
        message: "Access denied. Only admin can view commission balance.",
      });
      return;
    }

    const admin = await findCommissionBalance("admin");
    if (!admin) {
      res.status(404).json({ message: "Admin not found" });
      return;
    }

    res.status(200).json({
      message: "Commission balance fetched successfully",
      commissionBalance: admin.commissionBalance,
    });
  } catch (err) {
    console.error("Error in fetching commission balance --", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const updateUserProfile = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.user!;
    const { name } = req.body;
    const photo = req.file?.filename;

    if (!name && !photo) {
      res.status(400).json({ message: "Nothing to update" });
      return;
    }

    const user = await findUserById(id);
    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    // Update name and/or photo
    if (name) user.name = name;
    if (photo) {
      user.photo = `/uploads/${photo}`;
      console.log("Photo uploaded:", user.photo);
    }

    await user.save();

    res.status(200).json({
      message: `${
        user.role.charAt(0).toUpperCase() + user.role.slice(1)
      } profile updated successfully`,
      user,
    });
  } catch (err) {
    console.error("Error updating profile:", err);
    res.status(500).json({ message: "Internal server error" });
    return;
  }
};

// Controller
export const getAdminProfile = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.user!;

    const user = await findUserById(id);

    if (!user || user.role !== "admin") {
      res.status(403).json({ message: "Access denied" });
      return;
    }

    res.status(200).json({
      name: user.name,
      email: user.email,
      role: user.role,
      photo: user.photo, // Should be something like "/uploads/profile.jpg"
    });
  } catch (err) {
    console.error("Error fetching profile:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};
export const getSellerProfile = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.user!;

    const user = await findUserById(id);

    if (!user || user.role !== "seller") {
      res.status(403).json({ message: "Access denied" });
      return;
    }

    res.status(200).json({
      name: user.name,
      email: user.email,
      role: user.role,
      photo: user.photo, // Should be something like "/uploads/profile.jpg"
    });
  } catch (err) {
    console.error("Error fetching profile:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};
export const getBuyerProfile = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.user!;

    const user = await findUserById(id);

    if (!user || user.role !== "buyer") {
      res.status(403).json({ message: "Access denied" });
      return;
    }

    res.status(200).json({
      name: user.name,
      email: user.email,
      role: user.role,
      photo: user.photo, // Should be something like "/uploads/profile.jpg"
    });
  } catch (err) {
    console.error("Error fetching profile:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};
export const getSellerDashboardData = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const { id } = req.user!;
    const user = await findUserById(id);

    if (!user || user.role !== "seller") {
      res.status(403).json({ message: "Access denied" });
      return;
    }

    const products = await Product.find({ seller: user._id });

    const soldBids = await Bidding.find({
      product: { $in: products.map((p) => p._id) },
      isSold: true,
    });

    const favourites = await Wishlist.find({ user: user._id });

    // 4. Return structured response
    res.status(200).json({
      name: user.name,
      email: user.email,
      role: user.role,
      photo: user.photo,
      balance: user.balance,
      productCount: products.length,
      soldCount: soldBids.length,
      favourites: favourites ?? [],
    });
  } catch (err) {
    console.error("Error fetching seller dashboard data:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};
