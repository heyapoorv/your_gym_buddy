require('dotenv').config();
const mongoose = require('mongoose');
const Member = require('./models/Member');
const Attendance = require('./models/Attendance');

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/gymos';

const runTests = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB for verification');

    const activeMember = await Member.findOne({ status: 'active' });
    const expiredMember = await Member.findOne({ status: 'expired' });
    const inactiveMember = await Member.findOne({ status: 'inactive' });

    console.log('🔹 Active Member:', activeMember ? `${activeMember.name} (ID: ${activeMember._id})` : 'None');
    console.log('🔹 Expired Member:', expiredMember ? `${expiredMember.name} (ID: ${expiredMember._id})` : 'None');
    console.log('🔹 Inactive Member:', inactiveMember ? `${inactiveMember.name} (ID: ${inactiveMember._id})` : 'None');

    const testValidation = (member) => {
      if (!member) return 'No member found';
      if (member.status === 'inactive') {
        return '❌ Blocked: Member account is inactive.';
      }
      if (!member.planId) {
        return '❌ Blocked: Membership plan is not assigned.';
      }
      const todayDate = new Date();
      todayDate.setHours(0, 0, 0, 0);

      if (member.status === 'expired' || (member.planEndDate && new Date(member.planEndDate) < todayDate)) {
        return "❌ Blocked: Member's subscription plan has expired.";
      }
      return '🟢 Allowed: Check-in permitted.';
    };

    console.log('\n--- VALIDATION RESULTS ---');
    console.log('Active Member:', testValidation(activeMember));
    console.log('Expired Member:', testValidation(expiredMember));
    console.log('Inactive Member:', testValidation(inactiveMember));

    console.log('\n✅ Verification checks ran correctly!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Verification check failed:', err);
    process.exit(1);
  }
};

runTests();
