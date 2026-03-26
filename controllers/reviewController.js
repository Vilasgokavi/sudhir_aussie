const Review = require('../models/Review');
const Job = require('../models/Job');
const Booking = require('../models/Booking');

// @desc  Post a review
// @route POST /api/reviews
const postReview = async (req, res, next) => {
  try {
    const { professionalId, jobId, bookingId, rating, comment, tags } = req.body;

    const job = await Job.findById(jobId);
    if (!job) return res.status(404).json({ success: false, message: 'Job not found' });
    if (job.customerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Only the job owner can leave a review' });
    }

    if (bookingId) {
      const booking = await Booking.findById(bookingId);
      if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });
      if (booking.customerId.toString() !== req.user._id.toString()) {
        return res.status(403).json({ success: false, message: 'Not authorized to review this booking' });
      }
      if (booking.status !== 'completed') {
        return res.status(400).json({ success: false, message: 'Booking must be completed before leaving a review' });
      }
    }

    const review = await Review.create({
      customerId: req.user._id,
      professionalId,
      jobId,
      bookingId: bookingId || null,
      rating,
      comment,
      tags: tags || [],
    });

    // Update job status to completed
    await Job.findByIdAndUpdate(jobId, { status: 'completed' });

    res.status(201).json({ success: true, review });
  } catch (err) {
    next(err);
  }
};

// @desc  Get my review for a job (if any)
// @route GET /api/reviews/job/:jobId
const getMyReviewForJob = async (req, res, next) => {
  try {
    const review = await Review.findOne({ jobId: req.params.jobId, customerId: req.user._id });
    res.json({ success: true, review });
  } catch (err) {
    next(err);
  }
};

// @desc  Get reviews for a professional
// @route GET /api/reviews/:professionalId
const getReviews = async (req, res, next) => {
  try {
    const reviews = await Review.find({ professionalId: req.params.professionalId })
      .populate('customerId', 'name avatar')
      .populate('jobId', 'title category')
      .sort({ createdAt: -1 });
    res.json({ success: true, reviews });
  } catch (err) {
    next(err);
  }
};

module.exports = { postReview, getMyReviewForJob, getReviews };
