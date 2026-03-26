const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { requireRole } = require('../middleware/roleCheck');
const { createJob, getJobs, getJob, deleteJob } = require('../controllers/jobController');
const { upload } = require('../config/cloudinary');

router.post('/create', protect, requireRole('customer'), upload.array('images', 5), createJob);
router.get('/', protect, getJobs);
router.get('/:id', protect, getJob);
router.delete('/:id', protect, requireRole('customer'), deleteJob);

module.exports = router;
