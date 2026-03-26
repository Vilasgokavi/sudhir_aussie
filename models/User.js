const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true, minlength: 6 },
    role: { type: String, enum: ['customer', 'professional', 'admin'], default: 'customer' },
    avatar: { type: String, default: '' },
    phone: { type: String, default: '' },
    location: {
      address: { type: String, default: '' },
      city: { type: String, default: '' },
      state: { type: String, default: '' },
      coordinates: {
        lat: { type: Number },
        lng: { type: Number },
      },
      geo: {
        type: {
          type: String,
          enum: ['Point'],
          default: 'Point',
        },
        coordinates: {
          type: [Number], // [lng, lat]
          default: undefined,
        },
      },
    },
    isVerified: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// For nearby professional search
userSchema.index({ 'location.geo': '2dsphere' });

// Hash password before save
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare passwords
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
