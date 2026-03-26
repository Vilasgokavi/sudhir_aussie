const User = require('../models/User');
const Professional = require('../models/Professional');
const Job = require('../models/Job');
const Quote = require('../models/Quote');
const Booking = require('../models/Booking');
const Dispute = require('../models/Dispute');
const Review = require('../models/Review');

// ─── Users ─────────────────────────────────────────────────────────────────

// GET /api/admin/users
const getUsers = async (req, res, next) => {
  try {
    const { role, page = 1, limit = 20, search } = req.query;
    const filter = {};
    if (role) filter.role = role;
    if (search) filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
    ];
    const skip = (page - 1) * limit;
    const [users, total] = await Promise.all([
      User.find(filter).select('-password').sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)),
      User.countDocuments(filter),
    ]);
    res.json({ success: true, users, total, page: parseInt(page), pages: Math.ceil(total / limit) });
  } catch (err) { next(err); }
};

// PUT /api/admin/users/:id/suspend
const suspendUser = async (req, res, next) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, { isVerified: false }, { new: true }).select('-password');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    if (user.role === 'professional') {
      await Professional.findOneAndUpdate({ userId: user._id }, { isSuspended: true });
    }
    res.json({ success: true, message: 'User suspended', user });
  } catch (err) { next(err); }
};

// PUT /api/admin/users/:id/activate
const activateUser = async (req, res, next) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, { isVerified: true }, { new: true }).select('-password');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    if (user.role === 'professional') {
      await Professional.findOneAndUpdate({ userId: user._id }, { isSuspended: false });
    }
    res.json({ success: true, message: 'User activated', user });
  } catch (err) { next(err); }
};

// DELETE /api/admin/users/:id
const deleteUser = async (req, res, next) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    await Professional.findOneAndDelete({ userId: req.params.id });
    res.json({ success: true, message: 'User deleted' });
  } catch (err) { next(err); }
};

// ─── Professional Approvals ─────────────────────────────────────────────────

// GET /api/admin/professionals/pending
const getPendingProfessionals = async (req, res, next) => {
  try {
    const professionals = await Professional.find({ isApproved: false, isRejected: false })
      .populate('userId', 'name email avatar location createdAt phone')
      .sort({ createdAt: -1 });
    res.json({ success: true, professionals });
  } catch (err) { next(err); }
};

// GET /api/admin/professionals
const getAllProfessionals = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (status === 'approved') filter.isApproved = true;
    else if (status === 'pending') { filter.isApproved = false; filter.isRejected = false; }
    else if (status === 'rejected') filter.isRejected = true;
    else if (status === 'suspended') filter.isSuspended = true;
    const skip = (page - 1) * limit;
    const professionals = await Professional.find(filter)
      .populate('userId', 'name email avatar location createdAt')
      .sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit));
    const total = await Professional.countDocuments(filter);
    res.json({ success: true, professionals, total });
  } catch (err) { next(err); }
};

// PUT /api/admin/professionals/:id/approve
const approveProfessional = async (req, res, next) => {
  try {
    const professional = await Professional.findByIdAndUpdate(
      req.params.id,
      { isApproved: true, isRejected: false, isSuspended: false, rejectionReason: '', approvedAt: new Date(), approvedBy: req.user._id },
      { new: true }
    ).populate('userId', 'name email');
    if (!professional) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, message: 'Professional approved', professional });
  } catch (err) { next(err); }
};

// PUT /api/admin/professionals/:id/reject
const rejectProfessional = async (req, res, next) => {
  try {
    const { reason } = req.body;
    const professional = await Professional.findByIdAndUpdate(
      req.params.id,
      { isApproved: false, isRejected: true, rejectionReason: reason || 'Does not meet requirements' },
      { new: true }
    ).populate('userId', 'name email');
    if (!professional) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, message: 'Professional rejected', professional });
  } catch (err) { next(err); }
};

// ─── Disputes ───────────────────────────────────────────────────────────────

// GET /api/admin/disputes
const getDisputes = async (req, res, next) => {
  try {
    const { status } = req.query;
    const filter = status ? { status } : {};
    const disputes = await Dispute.find(filter)
      .populate('raisedBy', 'name email avatar')
      .populate('againstUser', 'name email avatar')
      .populate('bookingId')
      .sort({ createdAt: -1 });
    res.json({ success: true, disputes });
  } catch (err) { next(err); }
};

// PUT /api/admin/disputes/:id/resolve
const resolveDispute = async (req, res, next) => {
  try {
    const { resolution, adminNotes } = req.body;
    const dispute = await Dispute.findByIdAndUpdate(
      req.params.id,
      { status: 'resolved', resolution, adminNotes, resolvedBy: req.user._id, resolvedAt: new Date() },
      { new: true }
    );
    if (!dispute) return res.status(404).json({ success: false, message: 'Dispute not found' });
    res.json({ success: true, dispute });
  } catch (err) { next(err); }
};

// ─── Analytics ──────────────────────────────────────────────────────────────

// GET /api/admin/analytics
const getAnalytics = async (req, res, next) => {
  try {
    const [
      totalUsers, totalCustomers, totalProfessionals,
      pendingApprovals, totalJobs, openJobs, totalBookings,
      completedBookings, totalDisputes, openDisputes,
      totalReviews, recentUsers, recentJobs,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: 'customer' }),
      User.countDocuments({ role: 'professional' }),
      Professional.countDocuments({ isApproved: false, isRejected: false }),
      Job.countDocuments(),
      Job.countDocuments({ status: 'open' }),
      Booking.countDocuments(),
      Booking.countDocuments({ status: 'completed' }),
      Dispute.countDocuments(),
      Dispute.countDocuments({ status: 'open' }),
      Review.countDocuments(),
      User.find().sort({ createdAt: -1 }).limit(5).select('name email role createdAt avatar'),
      Job.find().sort({ createdAt: -1 }).limit(5).populate('customerId', 'name'),
    ]);

    // Jobs by category
    const jobsByCategory = await Job.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 7 },
    ]);

    // Registrations last 7 days
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const registrationsPerDay = await User.aggregate([
      { $match: { createdAt: { $gte: sevenDaysAgo } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);

    res.json({
      success: true,
      stats: {
        totalUsers, totalCustomers, totalProfessionals, pendingApprovals,
        totalJobs, openJobs, totalBookings, completedBookings,
        totalDisputes, openDisputes, totalReviews,
      },
      charts: { jobsByCategory, registrationsPerDay },
      recent: { users: recentUsers, jobs: recentJobs },
    });
  } catch (err) { next(err); }
};

module.exports = {
  getUsers, suspendUser, activateUser, deleteUser,
  getPendingProfessionals, getAllProfessionals, approveProfessional, rejectProfessional,
  getDisputes, resolveDispute,
  getAnalytics,
};
