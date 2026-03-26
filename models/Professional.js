const mongoose = require('mongoose');

const professionalSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    bio: { type: String, default: '' },
    skills: [{ type: String }],
    categories: [{ type: String }],
    experience: { type: Number, default: 0 },
    hourlyRate: { type: Number, default: 0 },
    portfolioImages: [{ type: String }],
    rating: { type: Number, default: 0 },
    reviewCount: { type: Number, default: 0 },
    jobsCompleted: { type: Number, default: 0 },
    totalEarnings: { type: Number, default: 0 },
    isAvailable: { type: Boolean, default: true },
    responseTime: { type: String, default: 'Within 24 hours' },
    website: { type: String, default: '' },
    licenseNumber: { type: String, default: '' },
    abn: { type: String, default: '' },
    insuranceVerified: { type: Boolean, default: false },
    // Admin approval workflow
    isApproved: { type: Boolean, default: false },
    isRejected: { type: Boolean, default: false },
    isSuspended: { type: Boolean, default: false },
    rejectionReason: { type: String, default: '' },
    approvedAt: { type: Date },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    // Services list
    services: [{ name: String, description: String, basePrice: Number }],
  },
  { timestamps: true }
);

module.exports = mongoose.model('Professional', professionalSchema);
