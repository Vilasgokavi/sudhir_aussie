/**
 * Seed script — creates demo accounts + rich sample data
 * Run: node seed.js (from server/ directory)
 */
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Professional = require('./models/Professional');
const Job = require('./models/Job');
const Quote = require('./models/Quote');
const Booking = require('./models/Booking');
const Review = require('./models/Review');

const seed = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('✅ Connected to MongoDB');

  // Wipe existing demo data
  const demoEmails = [
    'admin@servicehub.com',
    'customer@demo.com',
    'pro@demo.com',
    'pro2@demo.com',
    'customer2@demo.com',
  ];
  await User.deleteMany({ email: { $in: demoEmails } });
  await Professional.deleteMany({});
  await Job.deleteMany({});
  await Quote.deleteMany({});
  await Booking.deleteMany({});
  await Review.deleteMany({});
  console.log('🗑️  Cleared old demo data');

  // ─── Users ────────────────────────────────────────────────
  const admin = await User.create({
    name: 'Admin User',
    email: 'admin@servicehub.com',
    password: 'admin1234',
    role: 'admin',
    isVerified: true,
  });

  const customer = await User.create({
    name: 'Sarah Mitchell',
    email: 'customer@demo.com',
    password: 'demo1234',
    role: 'customer',
    isVerified: true,
    phone: '0412 345 678',
    location: { city: 'Sydney', state: 'NSW', address: '42 Market St' },
  });

  const customer2 = await User.create({
    name: 'James Carter',
    email: 'customer2@demo.com',
    password: 'demo1234',
    role: 'customer',
    isVerified: true,
    phone: '0455 111 222',
    location: { city: 'Melbourne', state: 'VIC', address: '15 Collins St' },
  });

  const proUser = await User.create({
    name: 'Mike Johnson',
    email: 'pro@demo.com',
    password: 'demo1234',
    role: 'professional',
    isVerified: true,
    phone: '0423 456 789',
    location: { city: 'Sydney', state: 'NSW' },
  });

  const proUser2 = await User.create({
    name: 'Emily Chen',
    email: 'pro2@demo.com',
    password: 'demo1234',
    role: 'professional',
    isVerified: true,
    phone: '0499 777 888',
    location: { city: 'Sydney', state: 'NSW' },
  });

  // ─── Professional Profiles ─────────────────────────────────
  const pro = await Professional.create({
    userId: proUser._id,
    bio: 'Licensed plumber with 12 years of experience in residential and commercial plumbing. Available 7 days a week including emergencies.',
    skills: ['Leak Repair', 'Pipe Installation', 'Hot Water Systems', 'Drain Cleaning', 'Gas Fitting'],
    categories: ['plumbing', 'gas fitting'],
    experience: 12,
    hourlyRate: 95,
    isApproved: true,
    isAvailable: true,
    licenseNumber: 'PLB-2024-NSW-123456',
    abn: '12 345 678 901',
    insuranceVerified: true,
    rating: 4.8,
    reviewCount: 47,
    jobsCompleted: 63,
    totalEarnings: 28500,
    responseTime: 'Within 1 hour',
    serviceArea: 'Sydney Metro',
  });

  const pro2 = await Professional.create({
    userId: proUser2._id,
    bio: 'Certified electrician specializing in residential wiring, solar panel installation, and safety inspections.',
    skills: ['Wiring', 'Solar Installation', 'Safety Inspection', 'Switchboard Upgrades', 'LED Lighting'],
    categories: ['electrical', 'solar'],
    experience: 8,
    hourlyRate: 110,
    isApproved: true,
    isAvailable: true,
    licenseNumber: 'ELC-2024-NSW-789012',
    abn: '98 765 432 109',
    insuranceVerified: true,
    rating: 4.9,
    reviewCount: 32,
    jobsCompleted: 41,
    totalEarnings: 35200,
    responseTime: 'Within 2 hours',
    serviceArea: 'Sydney Metro & Hills',
  });

  console.log('✓ Created 2 professional profiles');

  // ─── Jobs ──────────────────────────────────────────────────
  const job1 = await Job.create({
    customerId: customer._id,
    title: 'Leaking kitchen tap needs fixing',
    description: 'My kitchen tap has been dripping for 2 weeks. Also concerned about the pipe under the sink which has some rust. Need a licensed plumber ASAP.',
    category: 'plumbing',
    budget: { min: 100, max: 300 },
    location: { city: 'Sydney', state: 'NSW', address: '42 Market St' },
    urgency: 'urgent',
    status: 'completed',
    preferredDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
  });

  const job2 = await Job.create({
    customerId: customer._id,
    title: 'Install ceiling fan in bedroom',
    description: 'Need a ceiling fan installed in my master bedroom. I have already purchased the fan (Mercator Ikuu Series). Will need wiring done properly.',
    category: 'electrical',
    budget: { min: 150, max: 250 },
    location: { city: 'Sydney', state: 'NSW', address: '42 Market St' },
    urgency: 'normal',
    status: 'hired',
    preferredDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
  });

  const job3 = await Job.create({
    customerId: customer._id,
    title: 'Hot water system not working',
    description: 'My hot water system stopped working yesterday. It is a Rheem 315L. About 8 years old. Not sure if it needs repair or replacement.',
    category: 'plumbing',
    budget: { min: 200, max: 800 },
    location: { city: 'Sydney', state: 'NSW', address: '42 Market St' },
    urgency: 'urgent',
    status: 'open',
  });

  const job4 = await Job.create({
    customerId: customer2._id,
    title: 'Electrical safety inspection',
    description: 'Buying a new house and need a full electrical safety inspection completed before settlement. 4-bedroom house in Melbourne.',
    category: 'electrical',
    budget: { min: 200, max: 400 },
    location: { city: 'Melbourne', state: 'VIC', address: '15 Collins St' },
    urgency: 'normal',
    status: 'open',
  });

  const job5 = await Job.create({
    customerId: customer2._id,
    title: 'Garden clean up and lawn mowing',
    description: "Large backyard needs full clean up. Lawn hasn't been mowed in 2 months. Some weeding and hedge trimming required.",
    category: 'gardening',
    budget: { min: 150, max: 300 },
    location: { city: 'Melbourne', state: 'VIC', address: '15 Collins St' },
    urgency: 'normal',
    status: 'quoted',
  });

  console.log('✓ Created 5 sample jobs');

  // ─── Quotes ────────────────────────────────────────────────
  const quote1 = await Quote.create({
    jobId: job1._id,
    professionalId: proUser._id,
    price: 220,
    message: 'Happy to help fix your leaking tap and inspect the rust on the pipe. I can come tomorrow morning. Price includes parts and labour.',
    estimatedDuration: '1.5-2 hours',
    status: 'accepted',
  });

  const quote2 = await Quote.create({
    jobId: job2._id,
    professionalId: proUser2._id,
    price: 190,
    message: 'I can install your ceiling fan professionally and safely. All wiring will be done to Australian standards. Happy to come this week.',
    estimatedDuration: '2-3 hours',
    status: 'accepted',
  });

  const quote3 = await Quote.create({
    jobId: job3._id,
    professionalId: proUser._id,
    price: 350,
    message: 'I can diagnose your hot water system issue. If it needs replacement I can supply and install a new unit at a competitive rate. I have dealt with many Rheem units.',
    estimatedDuration: '2-4 hours',
    status: 'pending',
  });

  const quote4 = await Quote.create({
    jobId: job5._id,
    professionalId: proUser._id,
    price: 280,
    message: 'I can handle the full garden cleanup including mowing, weeding and hedge trimming. Happy to do a free assessment first.',
    estimatedDuration: 'Half day',
    status: 'pending',
  });

  // Update job statuses
  await Job.findByIdAndUpdate(job1._id, { status: 'completed' });
  await Job.findByIdAndUpdate(job2._id, { status: 'hired' });
  await Job.findByIdAndUpdate(job5._id, { status: 'quoted' });

  console.log('✓ Created 4 sample quotes');

  // ─── Bookings ──────────────────────────────────────────────
  const booking1 = await Booking.create({
    jobId: job1._id,
    quoteId: quote1._id,
    customerId: customer._id,
    professionalId: proUser._id,
    agreedPrice: 220,
    status: 'completed',
    scheduledDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    scheduledTime: '9:00 AM',
    notes: 'Please knock loud as doorbell is broken.',
    completedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000),
    paymentStatus: 'paid',
  });

  const booking2 = await Booking.create({
    jobId: job2._id,
    quoteId: quote2._id,
    customerId: customer._id,
    professionalId: proUser2._id,
    agreedPrice: 190,
    status: 'confirmed',
    scheduledDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
    scheduledTime: '10:00 AM',
    notes: 'Fan is in the garage. Will leave door unlocked.',
    paymentStatus: 'unpaid',
  });

  // Update pro stats
  await Professional.findByIdAndUpdate(pro._id, {
    $inc: { jobsCompleted: 1, totalEarnings: 220 },
  });

  console.log('✓ Created 2 sample bookings');

  // ─── Reviews ──────────────────────────────────────────────
  await Review.create({
    jobId: job1._id,
    bookingId: booking1._id,
    customerId: customer._id,
    professionalId: proUser._id,
    rating: 5,
    comment: 'Mike was fantastic! Arrived on time, fixed the leaking tap and replaced the rusted pipe. Very professional and clean. Highly recommend!',
    tags: ['on time', 'professional', 'great work'],
  });

  await Professional.findByIdAndUpdate(pro._id, {
    rating: 4.8,
    $inc: { reviewCount: 1 },
  });

  console.log('✓ Created 1 sample review');

  console.log(`
╔══════════════════════════════════════════════════╗
║           ✅ SEED COMPLETE!                       ║
╠══════════════════════════════════════════════════╣
║  ADMIN        admin@servicehub.com / admin1234   ║
║  CUSTOMER     customer@demo.com / demo1234       ║
║  CUSTOMER 2   customer2@demo.com / demo1234      ║
║  PROFESSIONAL pro@demo.com / demo1234            ║
║  PROFESSIONAL pro2@demo.com / demo1234           ║
╚══════════════════════════════════════════════════╝
  `);
  process.exit(0);
};

seed().catch((err) => {
  console.error('❌ Seed failed:', err.message);
  process.exit(1);
});
