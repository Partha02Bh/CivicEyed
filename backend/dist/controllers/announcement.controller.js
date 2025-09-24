"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAnnouncementStats = exports.deleteAnnouncement = exports.updateAnnouncement = exports.createAnnouncement = exports.getAnnouncementById = exports.getAnnouncements = void 0;
const announcement_model_1 = require("../models/announcement.model");
// @desc    Get all active announcements with optional filtering
// @route   GET /api/v1/announcements
// @access  Public
const getAnnouncements = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { pincode, category, priority, search, page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
        // Build query object
        const query = { isActive: true };
        // Add filters
        if (pincode) {
            query.pincode = pincode;
        }
        if (category && category !== 'All') {
            query.category = category;
        }
        if (priority && priority !== 'All') {
            query.priority = priority;
        }
        // Add search functionality
        if (search) {
            query.$or = [
                { title: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } },
                { location: { $regex: search, $options: 'i' } }
            ];
        }
        // Filter out expired announcements
        const now = new Date();
        query.$and = [
            {
                $or: [
                    { expiryDate: null },
                    { expiryDate: { $gt: now } }
                ]
            }
        ];
        // Calculate pagination
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;
        // Build sort object
        const sort = {};
        sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
        // Execute query with pagination
        const announcements = yield announcement_model_1.AnnouncementModel.find(query)
            .populate('createdBy', 'name email')
            .sort(sort)
            .skip(skip)
            .limit(limitNum)
            .lean();
        // Get total count for pagination
        const total = yield announcement_model_1.AnnouncementModel.countDocuments(query);
        res.json({
            success: true,
            data: announcements,
            pagination: {
                current: pageNum,
                pages: Math.ceil(total / limitNum),
                total,
                hasNext: pageNum < Math.ceil(total / limitNum),
                hasPrev: pageNum > 1
            }
        });
    }
    catch (error) {
        console.error('Error fetching announcements:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching announcements'
        });
    }
});
exports.getAnnouncements = getAnnouncements;
// @desc    Get single announcement by ID
// @route   GET /api/v1/announcements/:id
// @access  Public
const getAnnouncementById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const announcement = yield announcement_model_1.AnnouncementModel.findById(req.params.id)
            .populate('createdBy', 'name email');
        if (!announcement) {
            res.status(404).json({
                success: false,
                message: 'Announcement not found'
            });
            return;
        }
        res.json({
            success: true,
            data: announcement
        });
    }
    catch (error) {
        console.error('Error fetching announcement:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching announcement'
        });
    }
});
exports.getAnnouncementById = getAnnouncementById;
// @desc    Create new announcement (Admin only)
// @route   POST /api/v1/announcements
// @access  Private (Admin)
const createAnnouncement = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Check if user is admin
        if (req.role !== 'admin') {
            res.status(403).json({
                success: false,
                message: 'Access denied. Admin privileges required.'
            });
            return;
        }
        const { title, description, location, pincode, category, priority, scheduledDate, expiryDate } = req.body;
        // Validate required fields
        if (!title || !description || !location || !pincode) {
            res.status(400).json({
                success: false,
                message: 'Please provide all required fields: title, description, location, and pincode'
            });
            return;
        }
        // Validate pincode format
        const pincodeRegex = /^[1-9][0-9]{5}$/;
        if (!pincodeRegex.test(pincode)) {
            res.status(400).json({
                success: false,
                message: 'Please provide a valid 6-digit pincode'
            });
            return;
        }
        // Create new announcement
        const announcement = new announcement_model_1.AnnouncementModel({
            title,
            description,
            location,
            pincode,
            category: category || 'General',
            priority: priority || 'Medium',
            scheduledDate: scheduledDate ? new Date(scheduledDate) : null,
            expiryDate: expiryDate ? new Date(expiryDate) : null,
            createdBy: req.adminId || req.citizenId || ''
        });
        yield announcement.save();
        // Populate the createdBy field for response
        yield announcement.populate('createdBy', 'name email');
        res.status(201).json({
            success: true,
            message: 'Announcement created successfully',
            data: announcement
        });
    }
    catch (error) {
        console.error('Error creating announcement:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while creating announcement'
        });
    }
});
exports.createAnnouncement = createAnnouncement;
// @desc    Update announcement (Admin only)
// @route   PUT /api/v1/announcements/:id
// @access  Private (Admin)
const updateAnnouncement = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Check if user is admin
        if (req.role !== 'admin') {
            res.status(403).json({
                success: false,
                message: 'Access denied. Admin privileges required.'
            });
            return;
        }
        const { title, description, location, pincode, category, priority, scheduledDate, expiryDate, isActive } = req.body;
        // Find and update announcement
        const announcement = yield announcement_model_1.AnnouncementModel.findById(req.params.id);
        if (!announcement) {
            res.status(404).json({
                success: false,
                message: 'Announcement not found'
            });
            return;
        }
        // Update fields
        if (title)
            announcement.title = title;
        if (description)
            announcement.description = description;
        if (location)
            announcement.location = location;
        if (pincode) {
            // Validate pincode format
            const pincodeRegex = /^[1-9][0-9]{5}$/;
            if (!pincodeRegex.test(pincode)) {
                res.status(400).json({
                    success: false,
                    message: 'Please provide a valid 6-digit pincode'
                });
                return;
            }
            announcement.pincode = pincode;
        }
        if (category)
            announcement.category = category;
        if (priority)
            announcement.priority = priority;
        if (scheduledDate !== undefined)
            announcement.scheduledDate = scheduledDate ? new Date(scheduledDate) : undefined;
        if (expiryDate !== undefined)
            announcement.expiryDate = expiryDate ? new Date(expiryDate) : undefined;
        if (isActive !== undefined)
            announcement.isActive = isActive;
        yield announcement.save();
        yield announcement.populate('createdBy', 'name email');
        res.json({
            success: true,
            message: 'Announcement updated successfully',
            data: announcement
        });
    }
    catch (error) {
        console.error('Error updating announcement:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while updating announcement'
        });
    }
});
exports.updateAnnouncement = updateAnnouncement;
// @desc    Delete announcement (Admin only)
// @route   DELETE /api/v1/announcements/:id
// @access  Private (Admin)
const deleteAnnouncement = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Check if user is admin
        if (req.role !== 'admin') {
            res.status(403).json({
                success: false,
                message: 'Access denied. Admin privileges required.'
            });
            return;
        }
        const announcement = yield announcement_model_1.AnnouncementModel.findById(req.params.id);
        if (!announcement) {
            res.status(404).json({
                success: false,
                message: 'Announcement not found'
            });
            return;
        }
        // Soft delete by setting isActive to false
        announcement.isActive = false;
        yield announcement.save();
        res.json({
            success: true,
            message: 'Announcement deleted successfully'
        });
    }
    catch (error) {
        console.error('Error deleting announcement:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while deleting announcement'
        });
    }
});
exports.deleteAnnouncement = deleteAnnouncement;
// @desc    Get announcement statistics (Admin only)
// @route   GET /api/v1/announcements/stats/summary
// @access  Private (Admin)
const getAnnouncementStats = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Check if user is admin
        if (req.role !== 'admin') {
            res.status(403).json({
                success: false,
                message: 'Access denied. Admin privileges required.'
            });
            return;
        }
        const stats = yield announcement_model_1.AnnouncementModel.aggregate([
            {
                $group: {
                    _id: null,
                    total: { $sum: 1 },
                    active: { $sum: { $cond: ['$isActive', 1, 0] } },
                    byCategory: {
                        $push: {
                            category: '$category',
                            count: 1
                        }
                    },
                    byPriority: {
                        $push: {
                            priority: '$priority',
                            count: 1
                        }
                    }
                }
            }
        ]);
        res.json({
            success: true,
            data: stats[0] || { total: 0, active: 0, byCategory: [], byPriority: [] }
        });
    }
    catch (error) {
        console.error('Error fetching announcement stats:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching statistics'
        });
    }
});
exports.getAnnouncementStats = getAnnouncementStats;
