import express from "express";
import cors from "cors";
import appRouter from "./routes/routes";

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.use(appRouter);

export default app;
