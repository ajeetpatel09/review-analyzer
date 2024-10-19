import { Router } from "express";
import ProductController from "../controllers/product.controller";
import multer from "multer";

const storage = multer.memoryStorage();
const upload = multer({ storage });

const ProductRouter = Router();
const productController = new ProductController();

ProductRouter.post(
  "/excelToJson",
  upload.single("file"),
  productController.excelToJson
);

ProductRouter.get("/:productId", productController.getProductById);

export default ProductRouter;
