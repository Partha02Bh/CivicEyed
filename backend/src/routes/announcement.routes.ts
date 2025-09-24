import { Router } from "express";
import {
  getAnnouncements,
  getAnnouncementById,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
  getAnnouncementStats
} from "../controllers/announcement.controller";
import { authMiddleware } from "../middlerware/auth.middleware";

const router = Router();

// Public routes - Citizens can view announcements
router.get("/announcements", getAnnouncements);
router.get("/announcements/:id", getAnnouncementById);

// Admin only routes - Create, update, delete announcements
router.post("/announcements", authMiddleware, createAnnouncement);
router.put("/announcements/:id", authMiddleware, updateAnnouncement);
router.delete("/announcements/:id", authMiddleware, deleteAnnouncement);
router.get("/announcements/stats/summary", authMiddleware, getAnnouncementStats);

export default router;
