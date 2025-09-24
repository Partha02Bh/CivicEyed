import { Request, Response } from 'express';
import { AnnouncementModel, IAnnouncement } from '../models/announcement.model';

interface AuthRequest extends Request {
  citizenId?: string;
  adminId?: string;
  role?: "admin" | "citizen";
  user?: {
    id: string;
    role: "admin" | "citizen";
  };
}

// @desc    Get all active announcements with optional filtering
// @route   GET /api/v1/announcements
// @access  Public
export const getAnnouncements = async (req: Request, res: Response) => {
  try {
    const { 
      pincode, 
      category, 
      priority, 
      search, 
      page = 1, 
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build query object
    const query: any = { isActive: true };

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
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    // Build sort object
    const sort: any = {};
    sort[sortBy as string] = sortOrder === 'desc' ? -1 : 1;

    // Execute query with pagination
    const announcements = await AnnouncementModel.find(query)
      .populate('createdBy', 'name email')
      .sort(sort)
      .skip(skip)
      .limit(limitNum)
      .lean();

    // Get total count for pagination
    const total = await AnnouncementModel.countDocuments(query);

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
  } catch (error) {
    console.error('Error fetching announcements:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching announcements'
    });
  }
};

// @desc    Get single announcement by ID
// @route   GET /api/v1/announcements/:id
// @access  Public
export const getAnnouncementById = async (req: Request, res: Response) => {
  try {
    const announcement = await AnnouncementModel.findById(req.params.id)
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
  } catch (error) {
    console.error('Error fetching announcement:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching announcement'
    });
  }
};

// @desc    Create new announcement (Admin only)
// @route   POST /api/v1/announcements
// @access  Private (Admin)
export const createAnnouncement = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // Check if user is admin
    if (req.role !== 'admin') {
      res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.'
      });
      return;
    }

    const {
      title,
      description,
      location,
      pincode,
      category,
      priority,
      scheduledDate,
      expiryDate
    } = req.body;

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
    const announcement = new AnnouncementModel({
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

    await announcement.save();

    // Populate the createdBy field for response
    await announcement.populate('createdBy', 'name email');

    res.status(201).json({
      success: true,
      message: 'Announcement created successfully',
      data: announcement
    });
  } catch (error) {
    console.error('Error creating announcement:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating announcement'
    });
  }
};

// @desc    Update announcement (Admin only)
// @route   PUT /api/v1/announcements/:id
// @access  Private (Admin)
export const updateAnnouncement = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // Check if user is admin
    if (req.role !== 'admin') {
      res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.'
      });
      return;
    }

    const {
      title,
      description,
      location,
      pincode,
      category,
      priority,
      scheduledDate,
      expiryDate,
      isActive
    } = req.body;

    // Find and update announcement
    const announcement = await AnnouncementModel.findById(req.params.id);

    if (!announcement) {
      res.status(404).json({
        success: false,
        message: 'Announcement not found'
      });
      return;
    }

    // Update fields
    if (title) announcement.title = title;
    if (description) announcement.description = description;
    if (location) announcement.location = location;
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
    if (category) announcement.category = category;
    if (priority) announcement.priority = priority;
    if (scheduledDate !== undefined) announcement.scheduledDate = scheduledDate ? new Date(scheduledDate) : undefined;
    if (expiryDate !== undefined) announcement.expiryDate = expiryDate ? new Date(expiryDate) : undefined;
    if (isActive !== undefined) announcement.isActive = isActive;

    await announcement.save();
    await announcement.populate('createdBy', 'name email');

    res.json({
      success: true,
      message: 'Announcement updated successfully',
      data: announcement
    });
  } catch (error) {
    console.error('Error updating announcement:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating announcement'
    });
  }
};

// @desc    Delete announcement (Admin only)
// @route   DELETE /api/v1/announcements/:id
// @access  Private (Admin)
export const deleteAnnouncement = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // Check if user is admin
    if (req.role !== 'admin') {
      res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.'
      });
      return;
    }

    const announcement = await AnnouncementModel.findById(req.params.id);

    if (!announcement) {
      res.status(404).json({
        success: false,
        message: 'Announcement not found'
      });
      return;
    }

    // Soft delete by setting isActive to false
    announcement.isActive = false;
    await announcement.save();

    res.json({
      success: true,
      message: 'Announcement deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting announcement:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting announcement'
    });
  }
};

// @desc    Get announcement statistics (Admin only)
// @route   GET /api/v1/announcements/stats/summary
// @access  Private (Admin)
export const getAnnouncementStats = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // Check if user is admin
    if (req.role !== 'admin') {
      res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.'
      });
      return;
    }

    const stats = await AnnouncementModel.aggregate([
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
  } catch (error) {
    console.error('Error fetching announcement stats:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching statistics'
    });
  }
};
