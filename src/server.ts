import express from "express";
import { pool } from "./config/db";
import authRoutes from "./routes/authRoutes";
import userRoutes from "./routes/userRoutes";
import projectRoutes from "./routes/projectRoutes";
import submissionRoutes from "./routes/submissionRoutes";

const app = express();
const PORT = 3000;

app.use(express.json());
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/submissions", submissionRoutes);


app.get("/api/health", (req, res) => {
  res.status(200).json({
    message: "Code review API is running"
  });
});

async function startServer() {
  try {
    await pool.query("SELECT 1");
    console.log("Database connected");

    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Failed to connect to the database:", error);
    await pool.end();
    process.exitCode = 1;
  }
}

startServer();