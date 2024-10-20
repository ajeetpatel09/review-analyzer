import ProductService from "../service/product.service";
import { Request, RequestHandler, Response } from "express";
import { buildResponse } from "../common/utils";
import { ResourceNotFoundError, errorHandler } from "../common/error";

class ProductController {
  private _productService = new ProductService();

  getAllProducts: RequestHandler = async (req: Request, res: Response) => {
    try {
      const data = await this._productService.getAllProducts();
      return res
        .status(200)
        .send(buildResponse(data, "Products received successfully", ""));
    } catch (error) {
      errorHandler(res, error as Error);
    }
  };

  excelToJson: RequestHandler = async (req: Request, res: Response) => {
    try {
      const result = await this._productService.excelToJson(req);
      console.log("in controller, service done.");

      return res
        .status(200)
        .send(buildResponse(result, "Import successfull", ""));
    } catch (error) {
      errorHandler(res, error as Error);
    }
  };

  getProductById: RequestHandler = async (req: Request, res: Response) => {
    try {
      const productId = req.params.productId as string;
      if (!productId || productId == "") {
        throw new ResourceNotFoundError("Id not provided.");
      }
      const result = await this._productService.getProductById(productId);
      return res
        .status(200)
        .send(buildResponse(result, "Product data received..", ""));
    } catch (error) {
      errorHandler(res, error as Error);
    }
  };
}

export default ProductController;
