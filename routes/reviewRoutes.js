const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { requireRole } = require('../middleware/roleCheck');
const { postReview, getMyReviewForJob, getReviews } = require('../controllers/reviewController');

router.post('/', protect, requireRole('customer'), postReview);
router.get('/job/:jobId', protect, requireRole('customer'), getMyReviewForJob);
router.get('/:professionalId', getReviews);

module.exports = router;
