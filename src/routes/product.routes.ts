import { Router } from "express";
import ProductController from "../controllers/product.controller";
import multer from "multer";

const storage = multer.memoryStorage();
const upload = multer({ storage });

const ProductRouter = Router();
const productController = new ProductController();

ProductRouter.post(
  "/importProductsFromExcel",
  upload.single("file"),
  productController.excelToJson
);
