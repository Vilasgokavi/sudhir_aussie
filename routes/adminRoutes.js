const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { requireRole } = require('../middleware/roleCheck');
const {
  getUsers, suspendUser, activateUser, deleteUser,
  getPendingProfessionals, getAllProfessionals, approveProfessional, rejectProfessional,
  getDisputes, resolveDispute,
  getAnalytics,
} = require('../controllers/adminController');

const adminOnly = [protect, requireRole('admin')];

// Analytics
router.get('/analytics', ...adminOnly, getAnalytics);

// Users
router.get('/users', ...adminOnly, getUsers);
router.put('/users/:id/suspend', ...adminOnly, suspendUser);
router.put('/users/:id/activate', ...adminOnly, activateUser);
router.delete('/users/:id', ...adminOnly, deleteUser);

// Professionals
router.get('/professionals', ...adminOnly, getAllProfessionals);
router.get('/professionals/pending', ...adminOnly, getPendingProfessionals);
router.put('/professionals/:id/approve', ...adminOnly, approveProfessional);
router.put('/professionals/:id/reject', ...adminOnly, rejectProfessional);

// Disputes
router.get('/disputes', ...adminOnly, getDisputes);
router.put('/disputes/:id/resolve', ...adminOnly, resolveDispute);

module.exports = router;
