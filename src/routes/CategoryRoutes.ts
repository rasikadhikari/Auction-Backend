import express from "express";
import { auth, authorizeRoles } from "../Authenticator/auth";
import {
  getCreateCategory,
  getDeleteCategory,
  getFindCategory,
  getUpdateCategory,
} from "../controllers/CategoryController";

const category = express.Router();
category.use(express.json());
category.use(express.urlencoded({ extended: true }));

category.get("/", getFindCategory);
category.post("/", auth, authorizeRoles("admin"), getCreateCategory);
category.put("/:id", auth, getUpdateCategory);
category.delete("/:id", auth, getDeleteCategory);
export default category;
