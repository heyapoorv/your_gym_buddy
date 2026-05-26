const cron = require('node-cron');
const Member = require('../models/Member');
const Gym = require('../models/Gym');
const Notification = require('../models/Notification');

/**
 * Initialize all background cron jobs for GymOS.
 * This should be called once when the server starts.
 */
const initCronJobs = () => {
  console.log('⏳ Initializing Background Jobs...');

  // ─── JOB 1: Daily Member Membership Expiry Check ──────────────────────
  // Runs every day at 12:01 AM (00:01)
  cron.schedule('1 0 * * *', async () => {
    console.log('🔄 [CRON] Running daily membership expiry check...');
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Mark members as 'expired' if planEndDate is before today
      const expiredResult = await Member.updateMany(
        {
          planEndDate: { $lt: today },
          status: { $in: ['active', 'expiring'] },
        },
        { $set: { status: 'expired' } }
      );
      console.log(`✅ [CRON] Marked ${expiredResult.modifiedCount} members as expired.`);

      // Mark members as 'expiring' if their plan ends within 7 days
      const nextWeek = new Date(today);
      nextWeek.setDate(nextWeek.getDate() + 7);

      const expiringResult = await Member.updateMany(
        {
          planEndDate: { $gte: today, $lte: nextWeek },
          status: 'active',
        },
        { $set: { status: 'expiring' } }
      );
      console.log(`✅ [CRON] Marked ${expiringResult.modifiedCount} members as expiring soon.`);
    } catch (error) {
      console.error('❌ [CRON Error] Job 1 (membership expiry) failed:', error);
    }
  });

  // ─── JOB 2: GymOS Trial Expiry Check ──────────────────────────────────
  // Runs every day at 12:05 AM (00:05)
  // Marks trial gyms as expired and notifies their owner
  cron.schedule('5 0 * * *', async () => {
    console.log('🔄 [CRON] Running GymOS trial expiry check...');
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Find all gyms still on 'trial' status but whose trialEndsAt has passed
      const expiredTrials = await Gym.find({
        subscriptionStatus: 'trial',
        trialEndsAt: { $lt: today },
      }).select('_id name owner');

      if (expiredTrials.length === 0) {
        console.log('✅ [CRON] No expired trials found.');
        return;
      }

      const gymIds = expiredTrials.map((g) => g._id);

      // Bulk update all expired trial gyms
      await Gym.updateMany(
        { _id: { $in: gymIds } },
        { $set: { subscriptionStatus: 'expired' } }
      );

      // Create an in-app notification per gym
      const notifications = expiredTrials.map((gym) => ({
        gymId: gym._id,
        userId: gym.owner,
        type: 'subscription',
        title: 'Your GymOS Trial Has Ended',
        description:
          'Your 7-day free trial has expired. Upgrade to a paid plan to restore full access and continue managing your gym.',
        read: false,
      }));

      await Notification.insertMany(notifications);

      console.log(`✅ [CRON] Expired ${expiredTrials.length} trial gyms and sent notifications.`);
    } catch (error) {
      console.error('❌ [CRON Error] Job 2 (trial expiry) failed:', error);
    }
  });

  // ─── JOB 3: GymOS Paid Plan Expiry Check ──────────────────────────────
  // Runs every day at 12:05 AM (00:05), 2 seconds after Job 2
  // Marks active paid-plan gyms as expired and notifies their owner
  cron.schedule('5 0 * * *', async () => {
    console.log('🔄 [CRON] Running GymOS paid plan expiry check...');
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const expiredPaidGyms = await Gym.find({
        subscriptionStatus: 'active',
        planExpiresAt: { $lt: today },
      }).select('_id name owner plan');

      if (expiredPaidGyms.length === 0) {
        console.log('✅ [CRON] No expired paid plans found.');
        return;
      }

      const gymIds = expiredPaidGyms.map((g) => g._id);

      await Gym.updateMany(
        { _id: { $in: gymIds } },
        { $set: { subscriptionStatus: 'expired' } }
      );

      const notifications = expiredPaidGyms.map((gym) => ({
        gymId: gym._id,
        userId: gym.owner,
        type: 'subscription',
        title: 'Your GymOS Subscription Has Expired',
        description: `Your ${gym.plan} plan has expired. Renew your subscription to restore full access.`,
        read: false,
      }));

      await Notification.insertMany(notifications);

      console.log(`✅ [CRON] Expired ${expiredPaidGyms.length} paid-plan gyms and sent notifications.`);
    } catch (error) {
      console.error('❌ [CRON Error] Job 3 (paid plan expiry) failed:', error);
    }
  });

  console.log('✅ Background Jobs Scheduled.');
};

module.exports = initCronJobs;

