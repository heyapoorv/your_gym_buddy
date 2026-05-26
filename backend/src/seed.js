require('dotenv').config();
const mongoose = require('mongoose');

const User = require('./models/User');
const Gym = require('./models/Gym');
const Trainer = require('./models/Trainer');
const MembershipPlan = require('./models/MembershipPlan');
const Member = require('./models/Member');
const Payment = require('./models/Payment');
const Attendance = require('./models/Attendance');
const Lead = require('./models/Lead');
const Notification = require('./models/Notification');
const { PLAN_CONFIG } = require('./config/plans');

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/gymos';

const getRandomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const getRandomItem = (arr) => arr[Math.floor(Math.random() * arr.length)];

const connectDB = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ MongoDB Connected for Seeding...');
  } catch (error) {
    console.error('❌ MongoDB Connection Error:', error);
    process.exit(1);
  }
};

const clearDB = async () => {
  console.log('🧹 Clearing existing data...');
  await Promise.all([
    User.deleteMany({}),
    Gym.deleteMany({}),
    Trainer.deleteMany({}),
    MembershipPlan.deleteMany({}),
    Member.deleteMany({}),
    Payment.deleteMany({}),
    Attendance.deleteMany({}),
    Lead.deleteMany({}),
    Notification.deleteMany({}),
  ]);
  console.log('✅ Database cleared.');
};

/**
 * Helper: Create a gym with proper SaaS trial fields
 */
const createGym = async (ownerId, gymData, plan = 'trial') => {
  const planConfig = PLAN_CONFIG[plan];
  const now = new Date();

  let trialEndsAt = null;
  let planStartsAt = null;
  let planExpiresAt = null;
  let subscriptionStatus = 'trial';

  if (plan === 'trial') {
    trialEndsAt = new Date(now);
    trialEndsAt.setDate(trialEndsAt.getDate() + planConfig.durationDays);
    subscriptionStatus = 'trial';
  } else {
    planStartsAt = now;
    planExpiresAt = new Date(now);
    planExpiresAt.setDate(planExpiresAt.getDate() + planConfig.durationDays);
    subscriptionStatus = 'active';
  }

  return Gym.create({
    owner: ownerId,
    plan,
    subscriptionStatus,
    trialEndsAt,
    planStartsAt,
    planExpiresAt,
    maxMembers: planConfig.maxMembers,
    maxStaff: planConfig.maxStaff,
    maxBranches: planConfig.maxBranches,
    subscriptionHistory: [
      {
        plan,
        status: subscriptionStatus,
        startedAt: now,
        note: plan === 'trial' ? 'Trial started on signup.' : `Seeded with ${plan} plan.`,
      },
    ],
    ...gymData,
  });
};

const seedData = async () => {
  try {
    await connectDB();
    await clearDB();

    const now = new Date();

    console.log('\n👤 Seeding Users & Gyms...');

    // ─── 1. Super Admin ─────────────────────────────────────────────────
    await User.create({
      name: 'Platform Admin',
      email: 'admin@gymos.com',
      password: 'Admin@123',
      role: 'superadmin',
      gymId: null,
    });
    console.log('  ✓ SuperAdmin: admin@gymos.com / Admin@123');

    // ─── 2. Primary Gym Owner (Trial) ───────────────────────────────────
    const ownerUser = await User.create({
      name: 'Rahul Fitness',
      email: 'owner@gymos.com',
      password: 'Owner@123',
      role: 'gym_owner',
      gymId: null,
    });

    const gym = await createGym(ownerUser._id, {
      name: 'Elite Fitness Hub',
      email: 'contact@elitefitness.com',
      phone: '9876543210',
      address: { street: '123 Fitness Ave', city: 'Mumbai', state: 'Maharashtra', pincode: '400001' },
    }, 'trial');

    ownerUser.gymId = gym._id;
    await ownerUser.save({ validateBeforeSave: false });
    console.log('  ✓ GymOwner (Trial): owner@gymos.com / Owner@123 → Elite Fitness Hub');

    // ─── 3. Second Gym (Growth Plan) ────────────────────────────────────
    const owner2 = await User.create({
      name: 'Priya Wellness',
      email: 'priya@gymos.com',
      password: 'Owner@123',
      role: 'gym_owner',
      gymId: null,
    });

    const gym2 = await createGym(owner2._id, {
      name: 'PowerZone Gym',
      email: 'contact@powerzone.com',
      phone: '9123456789',
      address: { street: '45 Sector B', city: 'Pune', state: 'Maharashtra', pincode: '411001' },
    }, 'growth');

    owner2.gymId = gym2._id;
    await owner2.save({ validateBeforeSave: false });
    console.log('  ✓ GymOwner (Growth): priya@gymos.com / Owner@123 → PowerZone Gym');

    // ─── 4. Third Gym (Starter, near expiry) ───────────────────────────
    const owner3 = await User.create({
      name: 'Amit Sharma',
      email: 'amit@gymos.com',
      password: 'Owner@123',
      role: 'gym_owner',
      gymId: null,
    });

    // Create with starter, then manually set expiry to 3 days from now
    const gym3 = await createGym(owner3._id, {
      name: 'FitLife Studio',
      email: 'contact@fitlife.com',
      phone: '9876001234',
      address: { street: '12 MG Road', city: 'Bangalore', state: 'Karnataka', pincode: '560001' },
    }, 'starter');

    // Make it near expiry
    const nearExpiry = new Date();
    nearExpiry.setDate(nearExpiry.getDate() + 3);
    await Gym.findByIdAndUpdate(gym3._id, { planExpiresAt: nearExpiry });

    owner3.gymId = gym3._id;
    await owner3.save({ validateBeforeSave: false });
    console.log('  ✓ GymOwner (Starter, expiring): amit@gymos.com / Owner@123 → FitLife Studio');

    // ─── 5. Fourth Gym (Expired trial, for restriction testing) ─────────
    const owner4 = await User.create({
      name: 'Test Expired',
      email: 'expired@gymos.com',
      password: 'Owner@123',
      role: 'gym_owner',
      gymId: null,
    });

    const expiredTrialEnd = new Date();
    expiredTrialEnd.setDate(expiredTrialEnd.getDate() - 2); // expired 2 days ago

    const gym4 = await Gym.create({
      name: 'OldGym Fitness',
      email: 'contact@oldgym.com',
      phone: '9000000001',
      address: { street: '99 Old Lane', city: 'Delhi', state: 'Delhi', pincode: '110001' },
      owner: owner4._id,
      plan: 'trial',
      subscriptionStatus: 'expired',
      trialEndsAt: expiredTrialEnd,
      maxMembers: 50,
      maxStaff: 3,
      maxBranches: 1,
      subscriptionHistory: [
        { plan: 'trial', status: 'trial', startedAt: new Date(Date.now() - 9 * 86400000), note: 'Trial started on signup.' },
        { plan: 'trial', status: 'expired', startedAt: expiredTrialEnd, note: 'Trial expired.' },
      ],
    });
    owner4.gymId = gym4._id;
    await owner4.save({ validateBeforeSave: false });
    console.log('  ✓ GymOwner (EXPIRED trial): expired@gymos.com / Owner@123 → OldGym Fitness');

    // ─── 5.5 Demo Gym ───────────────────────────────────────────────────
    const demoOwner = await User.create({
      name: 'Interactive Demo',
      email: 'demo@gymos.com',
      password: 'Demo@123',
      role: 'gym_owner',
      gymId: null,
    });

    const demoGym = await Gym.create({
      name: 'Demo Fitness Club',
      email: 'contact@demofitness.com',
      phone: '9888800000',
      address: { street: '1 Demo Way', city: 'Demo City', state: 'Demo', pincode: '000000' },
      owner: demoOwner._id,
      plan: 'growth',
      subscriptionStatus: 'active',
      planStartsAt: new Date(),
      planExpiresAt: new Date(Date.now() + 30 * 86400000),
      maxMembers: 200,
      maxStaff: 10,
      maxBranches: 2,
      onboardingComplete: true, // Bypass onboarding for demo
      subscriptionHistory: [
        { plan: 'growth', status: 'active', startedAt: new Date(), note: 'Demo initialized.' }
      ],
    });
    demoOwner.gymId = demoGym._id;
    await demoOwner.save({ validateBeforeSave: false });
    
    // Seed Demo Data
    const demoPlan = await MembershipPlan.create({ gymId: demoGym._id, name: 'Demo Pro', durationDays: 30, price: 2999, description: 'Demo Monthly' });
    for (let i = 0; i < 15; i++) {
      const demoMember = await Member.create({
        gymId: demoGym._id,
        name: `Demo Member ${i + 1}`,
        phone: `99${getRandomInt(10000000, 99999999)}`,
        email: `demo${i + 1}@example.com`,
        joinDate: new Date(),
        status: 'active',
        planId: demoPlan._id,
        planStartDate: new Date(),
        planEndDate: new Date(Date.now() + 30 * 86400000),
      });
      await Payment.create({
        gymId: demoGym._id,
        memberId: demoMember._id,
        planId: demoPlan._id,
        amount: demoPlan.price,
        status: 'success',
        paymentMethod: 'card',
        paidAt: new Date(),
      });
    }
    await Lead.create({ gymId: demoGym._id, fullName: 'Demo Lead 1', phone: '9988776655', status: 'inquiry', source: 'website' });
    await Lead.create({ gymId: demoGym._id, fullName: 'Demo Lead 2', phone: '9988776656', status: 'trial', source: 'walk_in' });

    console.log('  ✓ Demo Gym Owner: demo@gymos.com / Demo@123 → Demo Fitness Club (Seeded)');

    // ─── 6. Trainer for primary gym ─────────────────────────────────────
    console.log('\n🏋️ Seeding Trainers...');
    const trainerUser1 = await User.create({
      name: 'Trainer One',
      email: 'trainer@gymos.com',
      password: 'Trainer@123',
      role: 'trainer',
      gymId: gym._id,
    });

    const trainer1 = await Trainer.create({
      userId: trainerUser1._id,
      gymId: gym._id,
      fullName: 'Trainer One',
      email: 'trainer@gymos.com',
      specialization: 'Strength Training',
      phone: '9988776655',
      salary: 35000,
    });

    const trainerUser2 = await User.create({
      name: 'Yoga Priya',
      email: 'trainer2@gymos.com',
      password: 'Trainer@123',
      role: 'trainer',
      gymId: gym._id,
    });

    const trainer2 = await Trainer.create({
      userId: trainerUser2._id,
      gymId: gym._id,
      fullName: 'Yoga Priya',
      email: 'trainer2@gymos.com',
      specialization: 'Yoga & Flexibility',
      phone: '9988001122',
      salary: 28000,
    });

    const trainersList = [trainer1, trainer2];
    console.log('  ✓ 2 trainers seeded: trainer@gymos.com / Trainer@123');

    // ─── 7. Membership Plans for primary gym ────────────────────────────
    console.log('\n📋 Seeding Membership Plans...');
    const planMonthly   = await MembershipPlan.create({ gymId: gym._id, name: 'Monthly Pro',     durationDays: 30,  price: 2000,  description: 'Basic 1 month' });
    const planQuarterly = await MembershipPlan.create({ gymId: gym._id, name: 'Quarterly Elite', durationDays: 90,  price: 5500,  description: '3 months' });
    const planYearly    = await MembershipPlan.create({ gymId: gym._id, name: 'Yearly VIP',      durationDays: 365, price: 18000, description: '12 months' });
    const planPT        = await MembershipPlan.create({ gymId: gym._id, name: 'PT Monthly',      durationDays: 30,  price: 8000,  description: 'Personal training' });
    const plans = [planMonthly, planQuarterly, planYearly, planPT];
    console.log('  ✓ 4 plans created');

    // ─── 8. Members, Payments & Attendance for primary gym ──────────────
    console.log('\n👥 Seeding Members, Payments & Attendance...');
    const statuses = ['active', 'active', 'active', 'expiring', 'expired', 'inactive'];
    const membersList = [];
    const numMembers = 38; // Within trial limit of 50

    for (let i = 0; i < numMembers; i++) {
      const status = getRandomItem(statuses);
      const plan = getRandomItem(plans);
      const trainer = Math.random() > 0.5 ? getRandomItem(trainersList) : null;

      let joinDate = new Date();
      let endDate = new Date();

      if (status === 'active') {
        joinDate = new Date(now.getTime() - getRandomInt(1, plan.durationDays - 10) * 86400000);
        endDate = new Date(joinDate.getTime() + plan.durationDays * 86400000);
      } else if (status === 'expiring') {
        joinDate = new Date(now.getTime() - (plan.durationDays - getRandomInt(1, 5)) * 86400000);
        endDate = new Date(joinDate.getTime() + plan.durationDays * 86400000);
      } else if (status === 'expired') {
        joinDate = new Date(now.getTime() - (plan.durationDays + getRandomInt(5, 30)) * 86400000);
        endDate = new Date(joinDate.getTime() + plan.durationDays * 86400000);
      } else {
        joinDate = new Date(now.getTime() - 100 * 86400000);
        endDate = new Date(now.getTime() - 70 * 86400000);
      }

      const member = await Member.create({
        gymId: gym._id,
        name: `Member ${i + 1}`,
        phone: `88${getRandomInt(10000000, 99999999)}`,
        email: `member${i + 1}@example.com`,
        joinDate,
        status,
        planId: plan._id,
        planStartDate: joinDate,
        planEndDate: endDate,
        trainerId: trainer ? trainer._id : null,
      });

      membersList.push(member);
      if (trainer) {
        await Trainer.findByIdAndUpdate(trainer._id, { $addToSet: { assignedMembers: member._id } });
      }

      // Payments
      let paymentStatus = 'success';
      if (status === 'active' && Math.random() < 0.1) paymentStatus = 'pending';
      if (status === 'expired') paymentStatus = getRandomItem(['failed', 'pending', 'success']);

      const paidAt = paymentStatus === 'success'
        ? joinDate
        : null;

      // Create payments spread over last 6 months for realistic revenue chart
      const monthsBack = getRandomInt(0, 5);
      const historicDate = new Date(now);
      historicDate.setMonth(historicDate.getMonth() - monthsBack);
      historicDate.setDate(getRandomInt(1, 28));

      await Payment.create({
        gymId: gym._id,
        memberId: member._id,
        planId: plan._id,
        amount: plan.price,
        status: paymentStatus,
        paymentMethod: getRandomItem(['cash', 'card', 'upi']),
        transactionId: `TXN${getRandomInt(10000, 99999)}`,
        paidAt: paymentStatus === 'success' ? historicDate : null,
      });

      // Attendance (last 60 days)
      const attendanceDays = getRandomInt(8, 25);
      for (let j = 0; j < attendanceDays; j++) {
        const attDate = new Date(now.getTime() - getRandomInt(0, 60) * 86400000);
        if (attDate >= joinDate && attDate <= (status === 'active' ? now : endDate)) {
          attDate.setHours(getRandomInt(6, 21), getRandomInt(0, 59), 0, 0);
          await Attendance.create({
            gymId: gym._id,
            memberId: member._id,
            date: attDate.toISOString().split('T')[0],
            checkInTime: attDate,
            checkOutTime: new Date(attDate.getTime() + getRandomInt(60, 120) * 60000),
          });
        }
      }
    }
    console.log(`  ✓ ${numMembers} members seeded with payments & attendance`);

    // ─── 9. Leads ───────────────────────────────────────────────────────
    console.log('\n📣 Seeding Leads...');
    const leadStages = ['inquiry', 'contacted', 'trial', 'converted', 'lost'];
    const leadSources = ['walk_in', 'website', 'referral', 'social_media', 'other'];
    const numLeads = 35;
    for (let i = 0; i < numLeads; i++) {
      await Lead.create({
        gymId: gym._id,
        fullName: `Lead ${i + 1}`,
        phone: `77${getRandomInt(10000000, 99999999)}`,
        status: getRandomItem(leadStages),
        source: getRandomItem(leadSources),
        notes: `Interested in ${getRandomItem(['weight loss', 'muscle gain', 'general fitness', 'yoga', 'HIIT'])}`,
      });
    }
    console.log(`  ✓ ${numLeads} leads seeded`);

    // ─── 10. Notifications ──────────────────────────────────────────────
    console.log('\n🔔 Seeding Notifications...');
    const notifications = [
      { gymId: gym._id, userId: ownerUser._id, title: 'Welcome to GymOS 🎉', description: 'Your gym setup is complete! Explore your dashboard.', type: 'system' },
      { gymId: gym._id, userId: ownerUser._id, title: 'Trial Active', description: 'Your 7-day free trial has started. You have full access to all features.', type: 'system' },
      { gymId: gym._id, userId: ownerUser._id, title: 'Payment Overdue', description: '5 members have overdue payments. Review in Financials.', type: 'billing' },
      { gymId: gym._id, userId: ownerUser._id, title: 'Memberships Expiring', description: '8 memberships are expiring this week. Follow up soon.', type: 'member_alert' },
      { gymId: gym._id, userId: ownerUser._id, title: 'New Leads', description: 'You have 3 new inquiries from Instagram.', type: 'lead_alert' },
    ];
    await Notification.insertMany(notifications);
    console.log(`  ✓ ${notifications.length} notifications seeded`);

    console.log('\n' + '='.repeat(60));
    console.log('✅ SEED COMPLETE — Demo Environment Ready');
    console.log('='.repeat(60));
    console.log('\n📋 Login Credentials:');
    console.log('  SuperAdmin : admin@gymos.com    / Admin@123');
    console.log('  GymOwner   : owner@gymos.com    / Owner@123  [Trial]');
    console.log('  GymOwner   : priya@gymos.com    / Owner@123  [Growth]');
    console.log('  GymOwner   : amit@gymos.com     / Owner@123  [Starter, expiring soon]');
    console.log('  GymOwner   : expired@gymos.com  / Owner@123  [Expired Trial]');
    console.log('  DemoOwner  : demo@gymos.com     / Demo@123   [Interactive Demo]');
    console.log('  Trainer    : trainer@gymos.com  / Trainer@123');
    console.log('='.repeat(60) + '\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Seed Error:', error);
    process.exit(1);
  }
};

seedData();
