import express from "express";
import { createServer } from "node:http";
import { setupWebSocketServer } from "./services/webSocketServer";
import { pool } from "./config/db";
import authRoutes from "./routes/authRoutes";
import userRoutes from "./routes/userRoutes";
import projectRoutes from "./routes/projectRoutes";
import submissionRoutes from "./routes/submissionRoutes";
import commentRoutes from "./routes/commentRoutes";
import commentManagementRoutes from "./routes/commentManagementRoutes";
import reviewRoutes from "./routes/reviewRoutes";
import { notFoundHandler, errorHandler } from "./middleware/errorHandler";

const app = express();
const server = createServer(app);
setupWebSocketServer(server);
const PORT = 3000;

app.use(express.json());
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/submissions", submissionRoutes);
app.use("/api/submissions", commentRoutes);
app.use("/api/comments", commentManagementRoutes);
app.use("/api/submissions", reviewRoutes);


app.get("/api/health", (req, res) => {
  res.status(200).json({
    message: "Code review API is running"
  });
});

// Fallbacks must come after all API routes.
app.use(notFoundHandler);
app.use(errorHandler);

async function startServer() {
  try {
    await pool.query("SELECT 1");
    console.log("Database connected");

    server.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Failed to connect to the database:", error);
    await pool.end();
    process.exitCode = 1;
  }
}

startServer();