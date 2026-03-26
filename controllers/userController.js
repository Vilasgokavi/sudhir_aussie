const User = require('../models/User');
const Professional = require('../models/Professional');

function normalizeGeoFromLocation(location) {
  const lat = location?.coordinates?.lat;
  const lng = location?.coordinates?.lng;
  const hasLatLng = Number.isFinite(lat) && Number.isFinite(lng);
  if (!hasLatLng) return null;
  return { type: 'Point', coordinates: [lng, lat] };
}

// @desc  Get current user profile
// @route GET /api/users/profile
const getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    let professional = null;
    if (user.role === 'professional') {
      professional = await Professional.findOne({ userId: user._id });
    }
    res.json({ success: true, user, professional });
  } catch (err) {
    next(err);
  }
};

// @desc  Update user profile
// @route PUT /api/users/update
const updateProfile = async (req, res, next) => {
  try {
    const { name, phone, location, avatar } = req.body;
    const geo = normalizeGeoFromLocation(location);
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { name, phone, location: location ? { ...location, ...(geo ? { geo } : {}) } : location, ...(avatar && { avatar }) },
      { new: true, runValidators: true }
    ).select('-password');
    res.json({ success: true, user });
  } catch (err) {
    next(err);
  }
};

// @desc  Update professional profile
// @route PUT /api/users/professional-profile
const updateProfessionalProfile = async (req, res, next) => {
  try {
    const { bio, skills, categories, experience, hourlyRate, website, licenseNumber } = req.body;
    const professional = await Professional.findOneAndUpdate(
      { userId: req.user._id },
      { bio, skills, categories, experience, hourlyRate, website, licenseNumber },
      { new: true, upsert: true }
    );
    res.json({ success: true, professional });
  } catch (err) {
    next(err);
  }
};

// @desc  List all professionals with optional filters
// @route GET /api/users/professionals
const listProfessionals = async (req, res, next) => {
  try {
    const { category, city, minRating, maxRate, page = 1, limit = 12 } = req.query;

    const professionalFilter = {};
    if (category) professionalFilter.categories = { $in: [category] };
    if (minRating) professionalFilter.rating = { $gte: parseFloat(minRating) };
    if (maxRate) professionalFilter.hourlyRate = { $lte: parseFloat(maxRate) };

    const skip = (page - 1) * limit;
    const professionals = await Professional.find(professionalFilter)
      .skip(skip)
      .limit(parseInt(limit))
      .populate('userId', 'name email avatar location phone');

    // Filter by city from user's location
    const filtered = city
      ? professionals.filter(
          (p) => p.userId?.location?.city?.toLowerCase().includes(city.toLowerCase())
        )
      : professionals;

    res.json({ success: true, count: filtered.length, professionals: filtered });
  } catch (err) {
    next(err);
  }
};

// @desc  Get single professional
// @route GET /api/users/professionals/:id
const getProfessional = async (req, res, next) => {
  try {
    const professional = await Professional.findOne({ userId: req.params.id }).populate(
      'userId',
      'name email avatar location phone createdAt'
    );
    if (!professional) return res.status(404).json({ success: false, message: 'Professional not found' });
    res.json({ success: true, professional });
  } catch (err) {
    next(err);
  }
};

// @desc  List nearby professionals (geo search)
// @route GET /api/users/professionals/nearby?lat=&lng=&radiusKm=&category=
const listNearbyProfessionals = async (req, res, next) => {
  try {
    const { lat, lng, radiusKm = 15, category, minRating, maxRate, limit = 30 } = req.query;
    const latNum = parseFloat(lat);
    const lngNum = parseFloat(lng);
    const radiusMeters = Math.max(1, parseFloat(radiusKm)) * 1000;

    if (!Number.isFinite(latNum) || !Number.isFinite(lngNum)) {
      return res.status(400).json({ success: false, message: 'lat and lng are required numbers' });
    }

    const professionalMatch = { isApproved: true, isSuspended: false };
    if (category) professionalMatch.categories = { $in: [category] };
    if (minRating) professionalMatch.rating = { $gte: parseFloat(minRating) };
    if (maxRate) professionalMatch.hourlyRate = { $lte: parseFloat(maxRate) };

    const results = await User.aggregate([
      {
        $geoNear: {
          near: { type: 'Point', coordinates: [lngNum, latNum] },
          key: 'location.geo',
          distanceField: 'distanceMeters',
          maxDistance: radiusMeters,
          spherical: true,
          query: { role: 'professional' },
        },
      },
      {
        $lookup: {
          from: 'professionals',
          localField: '_id',
          foreignField: 'userId',
          as: 'professional',
        },
      },
      { $unwind: '$professional' },
      { $match: { ...Object.fromEntries(Object.entries(professionalMatch).map(([k, v]) => [`professional.${k}`, v])) } },
      {
        $project: {
          _id: '$professional._id',
          userId: {
            _id: '$_id',
            name: '$name',
            email: '$email',
            avatar: '$avatar',
            phone: '$phone',
            location: '$location',
            createdAt: '$createdAt',
          },
          bio: '$professional.bio',
          skills: '$professional.skills',
          categories: '$professional.categories',
          experience: '$professional.experience',
          hourlyRate: '$professional.hourlyRate',
          rating: '$professional.rating',
          reviewCount: '$professional.reviewCount',
          jobsCompleted: '$professional.jobsCompleted',
          insuranceVerified: '$professional.insuranceVerified',
          isAvailable: '$professional.isAvailable',
          responseTime: '$professional.responseTime',
          services: '$professional.services',
          distanceKm: { $round: [{ $divide: ['$distanceMeters', 1000] }, 1] },
        },
      },
      { $limit: Math.min(parseInt(limit), 100) },
    ]);

    res.json({ success: true, count: results.length, professionals: results });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getProfile,
  updateProfile,
  updateProfessionalProfile,
  listProfessionals,
  listNearbyProfessionals,
  getProfessional,
};
