const Quote = require('../models/Quote');
const Job = require('../models/Job');

// @desc  Send a quote
// @route POST /api/quotes/send
const sendQuote = async (req, res, next) => {
  try {
    const { jobId, price, message, estimatedDuration, availability } = req.body;

    const job = await Job.findById(jobId);
    if (!job) return res.status(404).json({ success: false, message: 'Job not found' });
    if (job.status === 'hired' || job.status === 'completed') {
      return res.status(400).json({ success: false, message: 'This job is no longer accepting quotes' });
    }

    const existing = await Quote.findOne({ jobId, professionalId: req.user._id });
    if (existing) return res.status(400).json({ success: false, message: 'You have already sent a quote for this job' });

    const quote = await Quote.create({
      jobId,
      professionalId: req.user._id,
      price,
      message,
      estimatedDuration,
      availability,
    });

    // Increment job quote count & update status
    await Job.findByIdAndUpdate(jobId, {
      $inc: { quotesCount: 1 },
      $set: { status: 'quoted' },
    });

    res.status(201).json({ success: true, quote });
  } catch (err) {
    next(err);
  }
};

// @desc  Get quotes for a job
// @route GET /api/quotes/job/:jobId
const getQuotesByJob = async (req, res, next) => {
  try {
    const quotes = await Quote.find({ jobId: req.params.jobId })
      .populate('professionalId', 'name avatar location')
      .sort({ createdAt: -1 });
    res.json({ success: true, quotes });
  } catch (err) {
    next(err);
  }
};

// @desc  Get quotes sent by a professional
// @route GET /api/quotes/my
const getMyQuotes = async (req, res, next) => {
  try {
    const quotes = await Quote.find({ professionalId: req.user._id })
      .populate('jobId')
      .sort({ createdAt: -1 });
    res.json({ success: true, quotes });
  } catch (err) {
    next(err);
  }
};

// @desc  Accept a quote
// @route PUT /api/quotes/:id/accept
const acceptQuote = async (req, res, next) => {
  try {
    const quote = await Quote.findById(req.params.id);
    if (!quote) return res.status(404).json({ success: false, message: 'Quote not found' });

    const job = await Job.findById(quote.jobId);
    if (job.customerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    // Accept this quote, reject others
    quote.status = 'accepted';
    await quote.save();

    await Quote.updateMany(
      { jobId: quote.jobId, _id: { $ne: quote._id } },
      { $set: { status: 'rejected' } }
    );

    // Update job status
    await Job.findByIdAndUpdate(quote.jobId, {
      status: 'hired',
      hiredProfessionalId: quote.professionalId,
    });

    res.json({ success: true, quote });
  } catch (err) {
    next(err);
  }
};

// @desc  Withdraw a quote
// @route PUT /api/quotes/:id/withdraw
const withdrawQuote = async (req, res, next) => {
  try {
    const quote = await Quote.findById(req.params.id);
    if (!quote) return res.status(404).json({ success: false, message: 'Quote not found' });
    if (quote.professionalId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    quote.status = 'withdrawn';
    await quote.save();
    res.json({ success: true, message: 'Quote withdrawn' });
  } catch (err) {
    next(err);
  }
};

module.exports = { sendQuote, getQuotesByJob, getMyQuotes, acceptQuote, withdrawQuote };
