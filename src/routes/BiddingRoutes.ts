import express from "express";
import { auth, authorizeRoles } from "../Authenticator/auth";
import {
  getBiddingHistory,
  getPlaceBid,
  sellBidProduct,
} from "../controllers/BiddingController";
const bid = express.Router();
bid.use(express.json());
bid.use(express.urlencoded({ extended: true }));

bid.get("/bidding-history/:productId", auth, getBiddingHistory);
bid.post("/sell", auth, authorizeRoles("seller"), sellBidProduct);
bid.post("/bidding/:productId", auth, authorizeRoles("buyer"), getPlaceBid);

export default bid;
