const express = require('express');
const { checkIn, checkOut, getAttendance, getTodayStats } = require('../controllers/attendanceController');
const { protect } = require('../middleware/auth');
const { checkSubscriptionActive } = require('../middleware/subscriptionMiddleware');

const router = express.Router();

router.use(protect);

router.get('/today', getTodayStats);
router.get('/', getAttendance);
router.post('/checkin', checkSubscriptionActive, checkIn);
router.put('/checkout/:attendanceId', checkOut);

module.exports = router;
