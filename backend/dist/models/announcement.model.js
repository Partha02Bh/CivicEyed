"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnnouncementModel = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const announcementSchema = new mongoose_1.Schema({
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
        type: mongoose_1.Schema.Types.ObjectId,
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
announcementSchema.pre('save', function (next) {
    this.updatedAt = new Date();
    next();
});
// Virtual for formatted date
announcementSchema.virtual('formattedDate').get(function () {
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
exports.AnnouncementModel = mongoose_1.default.model('Announcement', announcementSchema);
