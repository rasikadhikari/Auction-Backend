import express from "express";
import {
  estimatedCommission,
  getAllUser,
  getDeleteUser,
  getUserBalance,
  loginUser,
  registerUser,
} from "../controllers/UserController";
import { auth, authorizeRoles } from "../Authenticator/auth";

const user = express.Router();

user.post("/login", loginUser);
user.post("/register", registerUser);
user.get("/", auth, getAllUser);
user.delete("/:id", getDeleteUser);
user.get("/:id/balance", auth, getUserBalance);
user.get("/commission", auth, authorizeRoles("admin"), estimatedCommission);

// test
user.get("/seller", auth, authorizeRoles("seller"), (req, res) => {
  res.status(200).json({ message: "Welcome seller!!!" });
});
user.get("/buyer", auth, authorizeRoles("buyer"), (req, res) => {
  res.status(200).json({ message: "Welcome buyer!!!" });
});
user.get("/admin", auth, authorizeRoles("admin"), (req, res) => {
  res.status(200).json({ message: "Welcome admin!!!" });
});

export default user;
