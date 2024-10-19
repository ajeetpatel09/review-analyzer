import { Router } from "express";
import ProductRouter from "./product.routes";

const router = Router({ mergeParams: true });

router.use("/product", ProductRouter);
export default router;
