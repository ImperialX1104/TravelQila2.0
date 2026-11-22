import "dotenv/config";
import express from "express";
import helmet from "helmet";
import cors from "cors";

const app = express();
const port = Number(process.env.PORT || 3001);
const allowedOrigins = (process.env.CORS_ORIGINS || "http://127.0.0.1:5173,http://localhost:5173")
  .split(",").map((value) => value.trim()).filter(Boolean);

app.disable("x-powered-by");
app.use(helmet());
app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error("Origin not allowed by CORS"));
  },
  credentials: true
}));
app.use(express.json({ limit: "32kb" }));

app.get("/api/health", (_req, res) => {
  res.status(200).json({ status: "ok", service: "travelqila-api" });
});

app.use((err, _req, res, _next) => {
  const status = err.status && Number.isInteger(err.status) ? err.status : 400;
  res.status(status).json({ error: status === 400 ? "Invalid request" : "Request failed" });
});

app.listen(port, "127.0.0.1", () => {
  console.log(`Travel Qila API listening on 127.0.0.1:${port}`);
});
