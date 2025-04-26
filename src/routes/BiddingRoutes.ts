import express from "express";
import { auth, authorizeRoles } from "../Authenticator/auth";
import {
  getBidCountByProduct,
  getBiddingHistory,
  getBuyerWinningBids,
  getPlaceBid,
  getSoldBids,
  sellBidProduct,
} from "../controllers/BiddingController";
const bid = express.Router();
bid.use(express.json());
bid.use(express.urlencoded({ extended: true }));

bid.get("/allbid", auth, getSoldBids);
bid.get("/bidding-history/:productId", auth, getBiddingHistory);
bid.post("/sell", auth, authorizeRoles("seller"), sellBidProduct);
bid.post("/bidding/:productId", auth, authorizeRoles("buyer"), getPlaceBid);
bid.get("/winning-bids", auth, authorizeRoles("buyer"), getBuyerWinningBids);
bid.get("/bid-count/:productId", auth, getBidCountByProduct);

export default bid;
