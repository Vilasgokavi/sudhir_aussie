const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema(
  {
    jobId: { type: mongoose.Schema.Types.ObjectId, ref: 'Job', required: true },
    quoteId: { type: mongoose.Schema.Types.ObjectId, ref: 'Quote', required: true },
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    professionalId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    scheduledDate: { type: Date, required: true },
    scheduledTime: { type: String, default: '' },
    agreedPrice: { type: Number, required: true },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'in_progress', 'completed', 'cancelled'],
      default: 'pending',
    },
    paymentStatus: {
      type: String,
      enum: ['unpaid', 'paid', 'refunded', 'disputed'],
      default: 'unpaid',
    },
    paymentMethod: { type: String, default: '' },
    stripePaymentIntentId: { type: String, default: '' },
    notes: { type: String, default: '' },
    completedAt: { type: Date },
    cancelledAt: { type: Date },
    cancellationReason: { type: String, default: '' },
  },
  { timestamps: true }
);

bookingSchema.index({ customerId: 1, status: 1 });
bookingSchema.index({ professionalId: 1, status: 1 });

module.exports = mongoose.model('Booking', bookingSchema);
