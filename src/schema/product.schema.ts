export type Review = {
  productId: string;
  name: string;
  date: string;
  rating: string;
  review: string;
};

export type Product = {
  productId: string;
  name: string;
  reviewsData: {
    date: number;
    rating: number;
    reviewMessage: string;
  }[];
};

export type analysisResponse = {
  sentiment: string;
  issues: string[];
  improvements: string[];
  hasDiscrepancy: string;
};
