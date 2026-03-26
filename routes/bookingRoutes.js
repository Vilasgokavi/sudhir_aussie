const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { requireRole } = require('../middleware/roleCheck');
const {
  createBooking, getBookings, getBooking,
  confirmBooking, completeBooking, cancelBooking,
} = require('../controllers/bookingController');

router.post('/', protect, requireRole('customer'), createBooking);
router.get('/', protect, getBookings);
router.get('/:id', protect, getBooking);
router.put('/:id/confirm', protect, requireRole('professional'), confirmBooking);
router.put('/:id/complete', protect, requireRole('professional'), completeBooking);
router.put('/:id/cancel', protect, cancelBooking);

module.exports = router;
