import express, { Request, Response } from "express";
import dotenv from "dotenv";
import router from "./routes/router";
import * as bodyParser from "body-parser";
import cors from "cors";

dotenv.config();

const app = express();

app.use(cors({ credentials: true, origin: true }));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json({ type: "application/json" }));

const port = process.env.PORT;

app.use("/api/v1", router);

app.get("/", (_req: Request, res: Response) => {
  res.send("Welcome Stranger!!");
});

app.listen(port, () => {
  console.log(`[server]: Server is running at http://localhost:${port}`);
});
