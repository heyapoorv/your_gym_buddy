const express = require('express');
const { getDashboardMetrics, getGyms, getGymDetails, updateGymPlan, editGym, deleteGym } = require('../controllers/dashboardController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.get('/', getDashboardMetrics);
router.get('/gyms', authorize('superadmin'), getGyms);
router.get('/gyms/:id', authorize('superadmin'), getGymDetails);
router.put('/gyms/:id/plan', authorize('superadmin'), updateGymPlan);
router.put('/gyms/:id', authorize('superadmin'), editGym);
router.delete('/gyms/:id', authorize('superadmin'), deleteGym);

module.exports = router;
