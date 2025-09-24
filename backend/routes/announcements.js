const express = require('express');
const router = express.Router();
const Announcement = require('../models/Announcement');
const auth = require('../middleware/auth');

// @route   GET /api/announcements
// @desc    Get all active announcements with optional filtering
// @access  Public
router.get('/', async (req, res) => {
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
    query.$or = [
      { expiryDate: null },
      { expiryDate: { $gt: now } }
    ];

    // Calculate pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Execute query with pagination
    const announcements = await Announcement.find(query)
      .populate('createdBy', 'name email')
      .sort(sort)
      .skip(skip)
      .limit(limitNum)
      .lean();

    // Get total count for pagination
    const total = await Announcement.countDocuments(query);

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
});

// @route   GET /api/announcements/:id
// @desc    Get single announcement by ID
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const announcement = await Announcement.findById(req.params.id)
      .populate('createdBy', 'name email');

    if (!announcement) {
      return res.status(404).json({
        success: false,
        message: 'Announcement not found'
      });
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
});

// @route   POST /api/announcements
// @desc    Create new announcement (Admin only)
// @access  Private (Admin)
router.post('/', auth, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.'
      });
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
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields: title, description, location, and pincode'
      });
    }

    // Validate pincode format
    const pincodeRegex = /^[1-9][0-9]{5}$/;
    if (!pincodeRegex.test(pincode)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid 6-digit pincode'
      });
    }

    // Create new announcement
    const announcement = new Announcement({
      title,
      description,
      location,
      pincode,
      category: category || 'General',
      priority: priority || 'Medium',
      scheduledDate: scheduledDate ? new Date(scheduledDate) : null,
      expiryDate: expiryDate ? new Date(expiryDate) : null,
      createdBy: req.user.id
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
});

// @route   PUT /api/announcements/:id
// @desc    Update announcement (Admin only)
// @access  Private (Admin)
router.put('/:id', auth, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.'
      });
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
    const announcement = await Announcement.findById(req.params.id);

    if (!announcement) {
      return res.status(404).json({
        success: false,
        message: 'Announcement not found'
      });
    }

    // Update fields
    if (title) announcement.title = title;
    if (description) announcement.description = description;
    if (location) announcement.location = location;
    if (pincode) {
      // Validate pincode format
      const pincodeRegex = /^[1-9][0-9]{5}$/;
      if (!pincodeRegex.test(pincode)) {
        return res.status(400).json({
          success: false,
          message: 'Please provide a valid 6-digit pincode'
        });
      }
      announcement.pincode = pincode;
    }
    if (category) announcement.category = category;
    if (priority) announcement.priority = priority;
    if (scheduledDate !== undefined) announcement.scheduledDate = scheduledDate ? new Date(scheduledDate) : null;
    if (expiryDate !== undefined) announcement.expiryDate = expiryDate ? new Date(expiryDate) : null;
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
});

// @route   DELETE /api/announcements/:id
// @desc    Delete announcement (Admin only)
// @access  Private (Admin)
router.delete('/:id', auth, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.'
      });
    }

    const announcement = await Announcement.findById(req.params.id);

    if (!announcement) {
      return res.status(404).json({
        success: false,
        message: 'Announcement not found'
      });
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
});

// @route   GET /api/announcements/stats/summary
// @desc    Get announcement statistics (Admin only)
// @access  Private (Admin)
router.get('/stats/summary', auth, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.'
      });
    }

    const stats = await Announcement.aggregate([
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
});

module.exports = router;
