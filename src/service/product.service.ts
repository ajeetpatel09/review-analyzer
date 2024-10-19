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

    const totalReviews = product.reviewsData.length;
    const averageRating =
      product.reviewsData.reduce((total, cur) => total + cur.rating, 0) /
      totalReviews;
    const ratingDistributionMap: { [key: string]: number } = {
      1: 0,
      2: 0,
      3: 0,
      4: 0,
      5: 0,
    };
    for (const review of product.reviewsData) {
      if (!ratingDistributionMap[review.rating]) {
        ratingDistributionMap[review.rating] = 1;
      } else {
        ratingDistributionMap[review.rating]++;
      }
    }
    const ratingDistribution = Object.keys(ratingDistributionMap).map(
      (rating) => ({
        rating: parseInt(rating),
        count: ratingDistributionMap[rating],
      })
    );
    const recentReviews = product.reviewsData.slice(0, 5);

    let prompt = `Below are the reviews of a product, it's in pairs with rating & review. Analyze it and respond in the format provided below, strictly adhering to this structure, result should be an array of result for each review :
    {
      "sentiment": "Positive/Negative/Neutral: a single word response",
      "issues": "return 5 issues for given product extract from review message, only if they're present else nothing.",
      "improvements": "return 5 keywords for improvement of given product extract from review message, only if they're present else nothing.",
      "hasDiscrepancy": "Yes/No, response is boolean depending upon whether there is a contradiction between rating vs review, like rating is 5 star but review is negative."
    }
    If we've 10 review pairs, return the above data for each of them.
    `;

    for (const review of product?.reviewsData) {
      prompt += `Rating: ${review.rating}
        Review: ${review.reviewMessage}
        
        `;
    }
    // console.log('prompt', prompt);

    const result = await this.analyzeReviews(prompt);

    return {
      ...result,
      totalReviews,
      averageRating,
      ratingDistribution,
      recentReviews,
    };
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
      const responseObject: analysisResponse[] | null = formattedResponse
        ? JSON.parse(formattedResponse)
        : null;

      if (!responseObject) {
        throw new ResourceNotFoundError(
          "Unable to process your request, please try again."
        );
      }
      const data = this.extractRelevantData(responseObject);
      return data;
    } catch (error) {
      console.log("error in calling gemini", error);
      return [];
    }
  };

  extractRelevantData = (analysisResult: analysisResponse[]) => {
    const sentimentsRatio: { [key: string]: number } = {};
    for (const cur of analysisResult) {
      if (!sentimentsRatio[cur.sentiment]) {
        sentimentsRatio[cur.sentiment] = 1;
      } else {
        sentimentsRatio[cur.sentiment]++;
      }
    }
    const discrepancies = analysisResult.reduce(
      (total, cur) => (cur.hasDiscrepancy == "Yes" ? total + 1 : total),
      0
    );

    const commonIssuesMap: { [key: string]: number } = {};
    for (const cur of analysisResult) {
      for (const issue of cur.issues) {
        if (!commonIssuesMap[issue]) {
          commonIssuesMap[issue] = 1;
        } else {
          commonIssuesMap[issue] += 1;
        }
      }
    }
    const commonIssues = Object.keys(commonIssuesMap).map((issue) => ({
      issue: issue,
      count: commonIssuesMap[issue],
    }));
    const top5Issues = commonIssues
      .sort((a, b) => b.count - a.count) // Sort in descending order of count
      .slice(0, 5);

    const improvementsMap: { [key: string]: number } = {};
    for (const cur of analysisResult) {
      for (const imp of cur.improvements) {
        if (!improvementsMap[imp]) {
          improvementsMap[imp] = 1;
        } else {
          improvementsMap[imp] += 1;
        }
      }
    }
    const improvements = Object.keys(improvementsMap).map((improvement) => ({
      improvement: improvement,
      count: improvementsMap[improvement],
    }));
    const top5Improvements = improvements
      .sort((a, b) => b.count - a.count) // Sort in descending order of count
      .slice(0, 5);
    return {
      sentimentsRatio,
      discrepancies,
      commonIssues: top5Issues,
      improvements: top5Improvements,
    };
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
