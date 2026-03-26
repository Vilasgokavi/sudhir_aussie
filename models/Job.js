const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema(
  {
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    category: { type: String, required: true },
    budget: {
      min: { type: Number, default: 0 },
      max: { type: Number, default: 0 },
      type: { type: String, enum: ['fixed', 'hourly', 'negotiable'], default: 'fixed' },
    },
    location: {
      address: { type: String, required: true },
      city: { type: String, required: true },
      state: { type: String, default: '' },
      coordinates: {
        lat: { type: Number },
        lng: { type: Number },
      },
    },
    images: [{ type: String }],
    preferredDate: { type: Date },
    urgency: { type: String, enum: ['flexible', 'within_week', 'urgent'], default: 'flexible' },
    status: {
      type: String,
      enum: ['open', 'quoted', 'hired', 'in_progress', 'completed', 'cancelled'],
      default: 'open',
    },
    hiredProfessionalId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    quotesCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

jobSchema.index({ category: 1, status: 1 });
jobSchema.index({ 'location.city': 1 });

module.exports = mongoose.model('Job', jobSchema);
