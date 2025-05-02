import { Request, Response } from "express";
import Wishlist from "../models/WishlistModel";
import { AuthRequest } from "../Authenticator/auth";

export const addToWishlist = async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;
  const { productId } = req.body;

  try {
    const exists = await Wishlist.findOne({ user: userId, product: productId });
    if (exists) {
      res.status(400).json({ message: "Already in wishlist" });
      return;
    }

    const wishlistItem = await Wishlist.create({
      user: userId,
      product: productId,
    });
    res.status(201).json({ message: "Added to wishlist", wishlistItem });
    return;
  } catch (err) {
    console.error("Error adding to wishlist:", err);
    res.status(500).json({ message: "Internal server error" });
    return;
  }
};

export const removeFromWishlist = async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;
  const { productId } = req.params;

  try {
    const deleted = await Wishlist.findOneAndDelete({
      user: userId,
      product: productId,
    });
    if (!deleted) {
      res.status(404).json({ message: "Item not found in wishlist" });
      return;
    }
    res.status(200).json({ message: "Removed from wishlist" });
    return;
  } catch (err) {
    console.error("Error removing from wishlist:", err);
    res.status(500).json({ message: "Internal server error" });
    return;
  }
};

export const getWishlist = async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;

  try {
    const wishlist = await Wishlist.find({ user: userId }).populate("product");
    res.status(200).json({ wishlist });
    return;
  } catch (err) {
    console.error("Error fetching wishlist:", err);
    res.status(500).json({ message: "Internal server error" });
    return;
  }
};
