// routes/wishlistRoutes.ts
import express from "express";
import { auth } from "../Authenticator/auth";
import {
  addToWishlist,
  getWishlist,
  removeFromWishlist,
} from "../controllers/WishlistController";

const wish = express.Router();

wish.post("/add", auth, addToWishlist);
wish.delete("/remove/:productId", auth, removeFromWishlist);
wish.get("/", auth, getWishlist);

export default wish;
