import { Request, Response } from "express";
import { AuthRequest } from "../Authenticator/auth";
import Bidding, { findBidding, placeBid } from "../models/BiddingModel";
import Product from "../models/ProductModel";
import mongoose from "mongoose";
import User from "../models/UserModel";
import { sendMail } from "../Utils/mailSender";
import { iUser } from "../models/UserModel";
import { Types } from "mongoose";
export const getBiddingHistory = async (req: AuthRequest, res: Response) => {
  try {
    const { productId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      res.status(400).json({ message: "Invalid product ID" });
      return;
    }

    const biddingHistory = await findBidding(
      new mongoose.Types.ObjectId(productId)
    );

    if (!biddingHistory || biddingHistory.length === 0) {
      res.status(404).json({ message: "No bidding history found" });
      return;
    }

    res.status(200).json({
      message: "Bidding history fetched successfully",
      bidding: biddingHistory,
    });
  } catch (err) {
    console.error("Error fetching bidding history:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getPlaceBid = async (req: AuthRequest, res: Response) => {
  try {
    const { productId, price } = req.body;
    const userId = req.user?.id;

    if (!productId || !price || !userId) {
      res.status(400).json({ message: "Missing required fields" });
      return;
    }

    const product = await Product.findById(productId).populate("user");
    if (!product) {
      res.status(404).json({ message: "Product not found" });
      return;
    }

    if (!product.isVerify) {
      res.status(400).json({ message: "Product is not verified for bidding" });
      return;
    }

    if (product.isSoldout) {
      res.status(400).json({ message: "Bidding is closed for this product" });
      return;
    }

    // Check if user already has a bid
    const existingUserBid = await Bidding.findOne({
      user: userId,
      product: productId,
    });

    if (existingUserBid) {
      if (price <= existingUserBid.price) {
        res.status(400).json({
          message: "Your bid must be higher than your previous bid",
        });
        return;
      }

      existingUserBid.price = price;
      await existingUserBid.save();

      res.status(200).json({
        message: "Your bid has been updated successfully",
        bid: existingUserBid,
      });
      return; // important to return after updating
    }

    // Check if there is any bid already
    const highestBid = await Bidding.findOne({ product: productId })
      .sort({ price: -1 })
      .populate("user");

    if (highestBid) {
      // There are existing bids
      if (price <= highestBid.price) {
        res.status(400).json({
          message: "Your bid must be higher than the current highest bid",
        });
        return;
      }
    } else {
      // No existing bids
      if (price < product.price) {
        res.status(400).json({
          message: `Your starting bid must be at least equal to or higher than the product's price (${product.price})`,
        });
        return;
      }
    }

    // Place new bid
    const newBid = await placeBid(productId, userId, price);

    res.status(200).json({
      message: "Bid placed successfully",
      bid: newBid,
    });
  } catch (err: any) {
    console.error("Bid Error:", err.message);
    res
      .status(500)
      .json({ message: "Internal server error", error: err.message });
    return;
  }
};

export const sellBidProduct = async (req: AuthRequest, res: Response) => {
  try {
    const { productId } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ message: "User ID not found in token" });
      return;
    }

    const product = await Product.findById(productId).populate("user");

    if (!product) {
      res.status(404).json({ message: "Product not found" });
      return;
    }
    if (product.user._id.toString() !== userId) {
      res
        .status(403)
        .json({ message: "you are not authorize to sell this product " });
      console.log(userId);

      return;
    }

    const highestBid = await Bidding.findOne({ product: productId })
      .sort({
        price: -1,
      })
      .populate<{ user: iUser & { _id: Types.ObjectId } }>("user");

    if (!highestBid || !highestBid.user) {
      res
        .status(400)
        .json({ message: "No winning bid found for this product" });
      return;
    }

    if (!("email" in highestBid.user)) {
      res.status(500).json({ message: "Bid user not populated correctly" });
      return;
    }

    const bidUser = highestBid.user as iUser;

    if (!highestBid) {
      res
        .status(400)
        .json({ message: "NO winniing bid found for this product" });
      return;
    }

    // commisiion rate and final product
    const commissionRate = product.commission;
    const commissionAmount = (commissionRate / 100) * (highestBid?.price ?? 0);
    const finalPrice = (highestBid?.price ?? 0) - commissionAmount;
    console.log("CommissionRate---", commissionRate);
    console.log("Commission Amount:", commissionAmount);
    console.log("Final Price to Seller:", finalPrice);

    product.isSoldout = true;
    if (highestBid?.user) {
      product.userTo = (highestBid.user as { _id: Types.ObjectId })._id;
    } else {
      throw new Error("Highest bid user is undefined");
    }
    product.soldPrice = finalPrice;

    const admin = await User.findOne({ role: "admin" });
    if (admin) {
      admin.commissionBalance += commissionAmount;
      await admin.save();
    }

    const seller = await User.findById(product.user._id);
    console.log("Seller before update:", seller);
    if (seller) {
      seller.balance += finalPrice;
      await seller.save();
    } else {
      res.status(404).json({ meesage: "Seller not found" });
      return;
    }

    await product.save();
    if (bidUser && bidUser.email) {
      await sendMail({
        email: bidUser.email,
        subject: "Congratulations! You won the auction 🥳",
        message: `<h1>Hello ${bidUser.name},</h1>
                  <p>You have successfully won the auction for <strong>${product.title}</strong>.</p>
                  <p>Final price: <strong>Rs.${highestBid.price}</strong></p>
                  <p>Thank you for bidding with us!</p>`,
      });
    } else {
      throw new Error("Bid user or email is undefined");
    }

    res.status(200).json({
      message: "Product sold successfully",
      soldTo: highestBid.user,
      finalPrice,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error", error: err });
  }
};
export const getSoldBids = async (req: AuthRequest, res: Response) => {
  try {
    const sellerId = req.user?.id;

    if (!sellerId) {
      res.status(401).json({ message: "Unauthorized access" });
      return;
    }

    // Find sold products by this seller
    const soldProducts = await Product.find({
      isSoldout: true,
      user: sellerId, // Only those sold by the logged-in seller
    })
      .populate("user", "name email") // Seller info
      .populate("userTo", "name email") // Buyer info
      .sort({ updatedAt: -1 });

    if (!soldProducts || soldProducts.length === 0) {
      res.status(404).json({
        message:
          "No sold bids found for this seller.Add product and See here !!!",
      });
    }

    const soldBids = soldProducts.map((product) => ({
      productId: product._id,
      title: product.title,
      soldPrice: product.soldPrice,
      buyer: product.userTo,
      seller: product.user,
      soldDate: product.updatedAt,
      status: "Sold",
    }));

    res.status(200).json({
      message: "Sold bids for the seller fetched successfully",
      soldBids,
    });
  } catch (error) {
    console.error("Error fetching seller's sold bids:", error);
    res.status(500).json({
      message: "Internal server error",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const getBuyerWinningBids = async (req: AuthRequest, res: Response) => {
  try {
    const buyerId = req.user?.id;

    if (!buyerId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const winningProducts = await Product.find({
      userTo: buyerId,
      isSoldout: true,
    })
      .populate("user", "name email")
      .sort({ updatedAt: -1 });

    if (!winningProducts || winningProducts.length === 0) {
      res.status(404).json({ message: "No winning bids found" });
      return;
    }

    const winningBids = winningProducts.map((product) => ({
      id: product._id,
      title: product.title,
      commission: product.commission,
      price: product.price,
      bidAmount: product.soldPrice,
      image: product.image,
      status: product.status,
    }));

    res
      .status(200)
      .json({ message: "Winning bids fetched successfully", winningBids });
  } catch (error) {
    console.error("Error fetching buyer's winning bids:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getBidCountByProduct = async (req: AuthRequest, res: Response) => {
  try {
    const { productId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      res.status(400).json({ message: "Invalid product ID" });
      return;
    }

    const bidCount = await Bidding.countDocuments({ product: productId });

    res.status(200).json({
      message: "Bid count fetched successfully",
      bidCount,
    });
  } catch (error) {
    console.error("Error fetching bid count:", error);
    res.status(500).json({
      message: "Internal server error",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};
