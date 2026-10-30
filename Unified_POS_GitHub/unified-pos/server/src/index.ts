import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import "express-async-errors";

import { tabRoutes } from "./routes/tabs";
import { orderRoutes } from "./routes/orders";
import { paymentRoutes } from "./routes/payments";
import { userRoutes } from "./routes/users";
import { managerRoutes } from "./routes/manager";
import { reportRoutes } from "./routes/reports";
import { printRoutes } from "./routes/print";
import { menuRoutes } from "./routes/menu";
import { requestRoutes } from "./routes/requests";
import { errorHandler } from "./middleware/errorHandler";

const app = express();
const PORT = process.env.PORT || 3001;

app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_URL || "http://localhost:5173" }));
app.use(express.json());
app.use(morgan("dev"));

app.get("/api/health", (_req, res) => { res.json({ status: "ok", timestamp: new Date().toISOString() }); });
app.use("/api/users", userRoutes);
app.use("/api/tabs", tabRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/manager", managerRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/print", printRoutes);
app.use("/api/menu", menuRoutes);
app.use("/api/requests", requestRoutes);
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`POS Server running on http://localhost:${PORT}`);
});

export default app;
