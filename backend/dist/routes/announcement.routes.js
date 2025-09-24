"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const announcement_controller_1 = require("../controllers/announcement.controller");
const auth_middleware_1 = require("../middlerware/auth.middleware");
const router = (0, express_1.Router)();
// Public routes - Citizens can view announcements
router.get("/announcements", announcement_controller_1.getAnnouncements);
router.get("/announcements/:id", announcement_controller_1.getAnnouncementById);
// Admin only routes - Create, update, delete announcements
router.post("/announcements", auth_middleware_1.authMiddleware, announcement_controller_1.createAnnouncement);
router.put("/announcements/:id", auth_middleware_1.authMiddleware, announcement_controller_1.updateAnnouncement);
router.delete("/announcements/:id", auth_middleware_1.authMiddleware, announcement_controller_1.deleteAnnouncement);
router.get("/announcements/stats/summary", auth_middleware_1.authMiddleware, announcement_controller_1.getAnnouncementStats);
exports.default = router;
