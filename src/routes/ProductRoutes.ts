import express from "express";
import {
  getAllProduct,
  getAllProductById,
  getCreateProduct,
  getDeleteProduct,
  getProductOfUser,
  getUpdateProduct,
  getVerifyAndAddCommissionByAdmin,
} from "../controllers/ProductController";
import { json } from "body-parser";
import { upload } from "../Utils/multer";
import { auth, authorizeRoles } from "../Authenticator/auth";

const product = express.Router();
product.use(json());
product.use(express.urlencoded({ extended: true }));
product.use(express.json());

product.get("/user", auth, getProductOfUser);
product.get("/", getAllProduct);
product.get("/:id", getAllProductById);
product.post(
  "/",
  auth,
  authorizeRoles("seller"),
  upload.single("image"),
  getCreateProduct
);
product.put(
  "/:id",
  auth,
  authorizeRoles("seller"),
  upload.single("image"),
  getUpdateProduct
);
product.delete("/:id", auth, authorizeRoles("seller"), getDeleteProduct);

product.patch(
  "/product-verify/:id",
  auth,
  authorizeRoles("admin"),
  getVerifyAndAddCommissionByAdmin
);

export default product;
