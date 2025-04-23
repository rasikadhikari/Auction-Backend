import mongoose, { model, Schema, Types } from "mongoose";
import { iUser } from "./UserModel";

export interface iBidding {
  price: number;
  product: Types.ObjectId;
  user: Types.ObjectId | iUser;
}

const biddingSchema = new Schema<iBidding>(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
  },
  { timestamps: true }
);
const Bidding = model<iBidding>("Bidding", biddingSchema);
export const findBidding = async (productId: mongoose.Types.ObjectId) => {
  return await Bidding.find({ product: productId })
    .populate("user")
    .populate("product");
};

export const placeBid = async (
  productId: string,
  userId: string,
  price: number
) => {
  const bid = await Bidding.create({
    user: userId,
    product: productId,
    price,
  });

  return bid;
};
export const findBid = async (productId: string, userId: string) => {
  return await Bidding.findOne({ product: productId, user: userId });
};
export default Bidding;
