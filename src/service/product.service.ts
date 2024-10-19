import { Request } from "express";
import { ResourceNotFoundError } from "../common/error";
import * as XLSX from "xlsx";
import { Product, Review, analysisResponse } from "../schema/product.schema";
import { productsData } from "../constants";
import { GoogleGenerativeAI } from "@google/generative-ai";

class ProductService {
  excelToJson = async (req: Request) => {
    if (!req.file) {
      throw new ResourceNotFoundError("File not found.");
    }
    const workbook = XLSX.read(req.file.buffer, {
      type: "buffer",
    });

    const worksheet = workbook.Sheets[workbook.SheetNames[0]];

    const placeholderProduct: Review = {
      productId: "",
      name: "",
      date: "",
      rating: "",
      review: "",
    };

    const xlsxData: Review[] = XLSX.utils.sheet_to_json(worksheet, {
      raw: true,
    });

    const reviewsData = xlsxData.map((data) => ({
      ...placeholderProduct,
      ...data,
    }));
    return formatProductReviews(reviewsData);
  };

  getProductById = async (productId: string) => {
    const product = productsData.find((cur) => cur.productId === productId);
    if (!product) {
      throw new ResourceNotFoundError("Product not found!!");
    }
    let prompt = `Below are reviews of a product, it's in pairs with rating & review. Analyze it and respond in the format provided below, strictly adhering to this structure, result is based on all reviews combined:
    {
      "sentiment": "Positive/Negative/Neutral: a single word response",
      "goodKeywords": "return 5 positive keywords of given product extract from review message, only if they're present else nothing.",
      "badKeywords": "return 5 negative keywords of given product extract from review message, only if they're present else nothing.",
      "discrepancies": "Number: response is a number of discrepancies in reviews, decided by if there's a contradiction between rating vs review, like rating is 5 star but review is negative."
    }
    
    `;

    for (const review of product?.reviewsData) {
      prompt += `Rating: ${review.rating}
        Review: ${review.reviewMessage}
        
        `;
    }
    // console.log('prompt', prompt);

    const result = await this.analyzeReviews(prompt);
    return result;
  };

  analyzeReviews = async (prompt: string) => {
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY!;
    const GEMINI_MODEL = process.env.GEMINI_MODEL!;

    try {
      const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

      const model = genAI.getGenerativeModel({
        model: GEMINI_MODEL,
        systemInstruction: "Act as an E-commmerce expert.",
      });

      const result = await model.generateContent(prompt);
      const rawText =
        result?.response?.candidates &&
        result?.response?.candidates[0]?.content?.parts[0].text;

      const formattedResponse = rawText
        ? rawText.replace(/```json\n|\n```/g, "").trim()
        : null;

      // Parsing the JSON string into an object
      const responseObject = formattedResponse
        ? JSON.parse(formattedResponse)
        : null;
      return responseObject;
    } catch (error) {
      console.log("error in calling gemini", error);
    }
  };
}

export default ProductService;

function formatProductReviews(reviews: Review[]): Product[] {
  const productMap: { [key: string]: Product } = {};

  reviews.forEach((review) => {
    const { productId, name, date, rating, review: reviewMessage } = review;

    if (!productMap[productId]) {
      productMap[productId] = {
        productId,
        name,
        reviewsData: [],
      };
    }

    // Push the details into the reviewsData array
    productMap[productId].reviewsData.push({
      date: Number(date),
      rating: Number(rating),
      reviewMessage,
    });
  });

  // Convert the object back to an array
  return Object.values(productMap);
}
