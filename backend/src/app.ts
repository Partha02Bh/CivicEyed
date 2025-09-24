import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import adminRoutes from "./routes/admin.routes";
import citizenRoutes from "./routes/citizen.routes";
import issueRoutes from "./routes/issue.routes";
import announcementRoutes from "./routes/announcement.routes";
import { IssueModel } from "./models/issue.model";

const app = express();

app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use(cookieParser());


// routes declaration

app.use("/api/v1", citizenRoutes);
app.use("/api/v1", adminRoutes);
app.use("/api/v1", issueRoutes);
app.use("/api/v1", announcementRoutes);
app.use("/api", (_req, res) => {
  res.status(404).json({ message: "API route not found" });
});
app.get('/', (req, res) => {
  res.send('Civic Issue Reporter Backend is Running');
});


export default app;

// One-time startup migration to backfill hype fields for existing issues
async function ensureHypeFields() {
  try {
    await IssueModel.updateMany(
      { hypePoints: { $exists: false } },
      { $set: { hypePoints: 0 } }
    );
    await IssueModel.updateMany(
      { hypedBy: { $exists: false } },
      { $set: { hypedBy: [] } }
    );
    await IssueModel.updateMany(
      { language: { $exists: false } },
      { $set: { language: "en" } }
    );
  } catch (err) {
    console.error("Failed to ensure hype and language fields:", err);
  }
}

// Fire and forget; do not block server start
ensureHypeFields();
