const Booking = require('../models/Booking');
const Quote = require('../models/Quote');
const Job = require('../models/Job');
const Professional = require('../models/Professional');

// POST /api/bookings  - Create booking after accepting a quote
const createBooking = async (req, res, next) => {
  try {
    const { quoteId, scheduledDate, scheduledTime, notes } = req.body;

    const quote = await Quote.findById(quoteId);
    if (!quote || quote.status !== 'accepted') {
      return res.status(400).json({ success: false, message: 'Quote not accepted or not found' });
    }

    const existing = await Booking.findOne({ quoteId });
    if (existing) return res.status(400).json({ success: false, message: 'Booking already exists for this quote' });

    const booking = await Booking.create({
      jobId: quote.jobId,
      quoteId,
      customerId: req.user._id,
      professionalId: quote.professionalId,
      agreedPrice: quote.price,
      scheduledDate,
      scheduledTime,
      notes,
    });

    await Job.findByIdAndUpdate(quote.jobId, { status: 'in_progress' });

    res.status(201).json({ success: true, booking });
  } catch (err) { next(err); }
};

// GET /api/bookings - list bookings (role-based)
const getBookings = async (req, res, next) => {
  try {
    const filter = req.user.role === 'customer'
      ? { customerId: req.user._id }
      : { professionalId: req.user._id };

    const bookings = await Booking.find(filter)
      .sort({ createdAt: -1 })
      .populate('jobId', 'title category')
      .populate('customerId', 'name avatar phone')
      .populate('professionalId', 'name avatar phone');

    res.json({ success: true, bookings });
  } catch (err) { next(err); }
};

// GET /api/bookings/:id
const getBooking = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('jobId')
      .populate('quoteId')
      .populate('customerId', 'name email avatar phone location')
      .populate('professionalId', 'name email avatar phone location');
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });
    res.json({ success: true, booking });
  } catch (err) { next(err); }
};

// PUT /api/bookings/:id/confirm  (professional)
const confirmBooking = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ success: false, message: 'Not found' });
    if (booking.professionalId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    booking.status = 'confirmed';
    await booking.save();
    res.json({ success: true, booking });
  } catch (err) { next(err); }
};

// PUT /api/bookings/:id/complete  (professional marks complete)
const completeBooking = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ success: false, message: 'Not found' });
    if (booking.professionalId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    booking.status = 'completed';
    booking.completedAt = new Date();
    await booking.save();

    // Update job status + professional stats
    await Job.findByIdAndUpdate(booking.jobId, { status: 'completed' });
    await Professional.findOneAndUpdate(
      { userId: booking.professionalId },
      { $inc: { jobsCompleted: 1, totalEarnings: booking.agreedPrice } }
    );

    res.json({ success: true, booking });
  } catch (err) { next(err); }
};

// PUT /api/bookings/:id/cancel
const cancelBooking = async (req, res, next) => {
  try {
    const { reason } = req.body;
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ success: false, message: 'Not found' });

    const isParty = [booking.customerId.toString(), booking.professionalId.toString()].includes(req.user._id.toString());
    if (!isParty && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    booking.status = 'cancelled';
    booking.cancelledAt = new Date();
    booking.cancellationReason = reason || '';
    await booking.save();
    await Job.findByIdAndUpdate(booking.jobId, { status: 'open', hiredProfessionalId: null });

    res.json({ success: true, booking });
  } catch (err) { next(err); }
};

module.exports = { createBooking, getBookings, getBooking, confirmBooking, completeBooking, cancelBooking };
