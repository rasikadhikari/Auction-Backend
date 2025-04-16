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
      res
        .status(403)
        .json({
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
