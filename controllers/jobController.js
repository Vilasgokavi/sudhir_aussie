const Job = require('../models/Job');

// @desc  Create a job
// @route POST /api/jobs/create
const createJob = async (req, res, next) => {
  try {
    const { title, description, category, budget, location, preferredDate, urgency } = req.body;
    // `multer-storage-cloudinary` typically sets `file.path` to the Cloudinary URL,
    // but we keep this defensive in case the shape changes.
    const images = req.files
      ? req.files.map((f) => f.secure_url || f.path || f.location || f.url).filter(Boolean)
      : [];

    const job = await Job.create({
      customerId: req.user._id,
      title,
      description,
      category,
      budget: typeof budget === 'string' ? JSON.parse(budget) : budget,
      location: typeof location === 'string' ? JSON.parse(location) : location,
      images,
      preferredDate,
      urgency,
    });

    res.status(201).json({ success: true, job });
  } catch (err) {
    next(err);
  }
};

// @desc  Get all open jobs (for professionals) or customer's jobs
// @route GET /api/jobs
const getJobs = async (req, res, next) => {
  try {
    const { category, city, status, page = 1, limit = 10 } = req.query;
    const filter = {};

    if (req.user.role === 'customer') {
      filter.customerId = req.user._id;
    } else {
      filter.status = { $in: ['open', 'quoted'] };
    }

    if (category) filter.category = category;
    if (city) filter['location.city'] = { $regex: city, $options: 'i' };
    if (status && req.user.role === 'customer') filter.status = status;

    const skip = (page - 1) * limit;
    const jobs = await Job.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('customerId', 'name avatar location');

    const total = await Job.countDocuments(filter);
    res.json({ success: true, jobs, total, page: parseInt(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    next(err);
  }
};

// @desc  Get single job
// @route GET /api/jobs/:id
const getJob = async (req, res, next) => {
  try {
    const job = await Job.findById(req.params.id).populate('customerId', 'name avatar location');
    if (!job) return res.status(404).json({ success: false, message: 'Job not found' });
    res.json({ success: true, job });
  } catch (err) {
    next(err);
  }
};

// @desc  Delete a job
// @route DELETE /api/jobs/:id
const deleteJob = async (req, res, next) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ success: false, message: 'Job not found' });
    if (job.customerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    await job.deleteOne();
    res.json({ success: true, message: 'Job deleted' });
  } catch (err) {
    next(err);
  }
};

module.exports = { createJob, getJobs, getJob, deleteJob };
