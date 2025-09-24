import mongoose, { Document, Schema } from 'mongoose';

export interface IAnnouncement extends Document {
  title: string;
  description: string;
  location: string;
  pincode: string;
  category: 'Emergency' | 'Maintenance' | 'General' | 'Festival' | 'Traffic' | 'Utility';
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  scheduledDate?: Date;
  expiryDate?: Date;
  isActive: boolean;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const announcementSchema = new Schema<IAnnouncement>({
  title: {
    type: String,
    required: true,
    trim: true,
    maxLength: 200
  },
  description: {
    type: String,
    required: true,
    trim: true,
    maxLength: 2000
  },
  location: {
    type: String,
    required: true,
    trim: true,
    maxLength: 100
  },
  pincode: {
    type: String,
    required: true,
    trim: true,
    match: /^[1-9][0-9]{5}$/ // Indian pincode validation
  },
  category: {
    type: String,
    enum: ['Emergency', 'Maintenance', 'General', 'Festival', 'Traffic', 'Utility'],
    default: 'General'
  },
  priority: {
    type: String,
    enum: ['Low', 'Medium', 'High', 'Critical'],
    default: 'Medium'
  },
  scheduledDate: {
    type: Date,
    default: null
  },
  expiryDate: {
    type: Date,
    default: null
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'Admin',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Index for efficient querying
announcementSchema.index({ pincode: 1, createdAt: -1 });
announcementSchema.index({ category: 1, createdAt: -1 });
announcementSchema.index({ priority: 1, createdAt: -1 });
announcementSchema.index({ isActive: 1, createdAt: -1 });

// Update the updatedAt field before saving
announcementSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Virtual for formatted date
announcementSchema.virtual('formattedDate').get(function() {
  return this.createdAt.toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
});

// Ensure virtual fields are serialized
announcementSchema.set('toJSON', { virtuals: true });

export const AnnouncementModel = mongoose.model<IAnnouncement>('Announcement', announcementSchema);
