const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
  {
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    professionalId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    jobId: { type: mongoose.Schema.Types.ObjectId, ref: 'Job', required: true },
    bookingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', default: null },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, required: true },
    tags: [{ type: String }], // e.g. ['on time', 'professional', 'great work']
  },
  { timestamps: true }
);

// One review per customer per job
reviewSchema.index({ jobId: 1, customerId: 1 }, { unique: true });

// Auto-update professional's average rating after a review is saved
reviewSchema.post('save', async function () {
  const Review = this.constructor;
  const Professional = require('./Professional');

  const stats = await Review.aggregate([
    { $match: { professionalId: this.professionalId } },
    { $group: { _id: '$professionalId', avgRating: { $avg: '$rating' }, count: { $sum: 1 } } },
  ]);

  if (stats.length > 0) {
    await Professional.findOneAndUpdate(
      { userId: this.professionalId },
      { rating: Math.round(stats[0].avgRating * 10) / 10, reviewCount: stats[0].count }
    );
  }
});

module.exports = mongoose.model('Review', reviewSchema);
