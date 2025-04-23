import express from "express";
import {
  assignBuyerToProduct,
  getAllProduct,
  getAllProductById,
  getCreateProduct,
  getDeleteProduct,
  getProductOfUser,
  getProductsByCreatorRole,
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
product.post("/", auth, upload.single("image"), getCreateProduct);
product.put(
  "/:id",
  auth,
  authorizeRoles("seller"),
  upload.single("image"),
  getUpdateProduct
);
product.delete("/:id", auth, authorizeRoles("seller"), getDeleteProduct);

product.put("/:id/product-assign", auth, assignBuyerToProduct);

product.patch(
  "/product-verify/:id",
  auth,
  authorizeRoles("admin"),
  getVerifyAndAddCommissionByAdmin
);

product.get("/by-role/:role", getProductsByCreatorRole);

export default product;
