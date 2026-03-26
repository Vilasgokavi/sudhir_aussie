const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { requireRole } = require('../middleware/roleCheck');
const {
  getProfile,
  updateProfile,
  updateProfessionalProfile,
  listProfessionals,
  listNearbyProfessionals,
  getProfessional,
} = require('../controllers/userController');

router.get('/profile', protect, getProfile);
router.put('/update', protect, updateProfile);
router.put('/professional-profile', protect, requireRole('professional'), updateProfessionalProfile);
router.get('/professionals', listProfessionals);
router.get('/professionals/nearby', listNearbyProfessionals);
router.get('/professionals/:id', getProfessional);

module.exports = router;
