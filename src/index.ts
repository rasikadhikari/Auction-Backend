import { json, urlencoded } from "body-parser";
import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import user from "./routes/UserRoutes";
import product from "./routes/ProductRoutes";
import bid from "./routes/BiddingRoutes";
import category from "./routes/CategoryRoutes";

dotenv.config();

const app = express();
app.use(cors());
app.use(json());
app.use(express.json());
app.use(urlencoded({ extended: true }));

app.use("/user", user);
app.use("/product", product);
app.use("/bid", bid);
app.use("/category", category);

mongoose
  .connect("mongodb://localhost:27017/", { dbName: "Auction" })
  .then(() => {
    console.log("Connected to database");
    app.listen(process.env.PORT || 4000, () => {
      console.log("App is running !!!");
    });
  })
  .catch((err) => {
    console.error("Error connecting to database:", err);
  });
