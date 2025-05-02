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
import Product from "../models/ProductModel";

const product = express.Router();
product.use(json());
product.use(express.urlencoded({ extended: true }));
product.use(express.json());

product.get("/user", auth, getProductOfUser);
product.get("/", getAllProduct);
product.get("/:id", getAllProductById);
product.post("/", auth, upload.single("image"), getCreateProduct);
product.put("/:id", auth, upload.single("image"), getUpdateProduct);
product.delete("/:id", auth, getDeleteProduct);

product.put("/:id/product-assign", auth, assignBuyerToProduct);

product.patch(
  "/product-verify/:id",
  auth,
  authorizeRoles("admin"),
  getVerifyAndAddCommissionByAdmin
);
product.patch("/:id/archive", auth, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      res.status(404).json({ message: "Product not found" });
      return;
    }

    // Toggle isArchived field
    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      { isArchived: !product.isArchived },
      { new: true }
    );

    res.json({ success: true, product: updatedProduct });
  } catch (err) {
    res.status(500).json({ message: "Failed to archive/unarchive product" });
  }
});

product.get("/by-role/:role", getProductsByCreatorRole);

export default product;
