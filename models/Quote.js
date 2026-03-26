const mongoose = require('mongoose');

const quoteSchema = new mongoose.Schema(
  {
    jobId: { type: mongoose.Schema.Types.ObjectId, ref: 'Job', required: true },
    professionalId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    price: { type: Number, required: true },
    estimatedDuration: { type: String, default: '' },
    message: { type: String, required: true },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected', 'withdrawn'],
      default: 'pending',
    },
    availability: { type: Date },
  },
  { timestamps: true }
);

// One quote per professional per job
quoteSchema.index({ jobId: 1, professionalId: 1 }, { unique: true });

module.exports = mongoose.model('Quote', quoteSchema);
