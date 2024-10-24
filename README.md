# Review-Analyzer

It's a standalone backend for review-dashboard-frontend, it provides all the APIs for getting, creating and providing analysis of reviews/feedbacks of all products using Gemini.

## Tech Stack 🚀

- NodeJS & ExpressJS
- Gemini API for generating the analysis of all reviews for individual products.

## Features ⭐
- Provides detailed analysis for overall products sales
- Analysis of all reviews using Gemini.

## Installation 🛠️
To get started, follow these steps:

### Prerequisites
- Node.js: Ensure that you have Node.js installed. You can download it from nodejs.org.

## Clone the Repository
```
git clone https://github.com/ajeetpatel09/review-analyzer.git
cd review-analyzer
```

## Install Dependencies
```
yarn
```

## Configuration ⚙️
Before running the application, you need to configure the environment variables:

Create a .env file in the root of the project directory.
Add your GitHub API token and Gemini API key to the .env file:
```
PORT=8000
VITE_GEMINI_API_KEY=
VITE_GEMINI_MODEL=gemini-1.5-flash
```

Once you have installed the dependencies and configured the environment variables, you can start the application using the following command:
```
yarn dev
```

## Endpoints
```
- /product/excelToJson -> used of importing data from excel file
- /product/:productId -> get product details
- /product/ -> get all products details
```

## Acknowledgments 🙏
- Gemini API