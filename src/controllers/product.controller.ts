import ProductService from "../service/product.service";
import { Request, Response } from "express";
import { buildResponse } from "../common/utils";

class ProductController {
  private _productService = new ProductService();

  excelToJson = async (req: Request, res: Response) => {
    try {
      await this._productService.excelToJson(req);
      return res
        .status(200)
        .send(buildResponse(null, "Import successfull", ""));
    } catch (error) {}
  };
}

export default ProductController;
