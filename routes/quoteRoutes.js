const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { requireRole } = require('../middleware/roleCheck');
const {
  sendQuote,
  getQuotesByJob,
  getMyQuotes,
  acceptQuote,
  withdrawQuote,
} = require('../controllers/quoteController');

router.post('/send', protect, requireRole('professional'), sendQuote);
router.get('/my', protect, requireRole('professional'), getMyQuotes);
router.get('/job/:jobId', protect, getQuotesByJob);
router.put('/:id/accept', protect, requireRole('customer'), acceptQuote);
router.put('/:id/withdraw', protect, requireRole('professional'), withdrawQuote);

module.exports = router;
