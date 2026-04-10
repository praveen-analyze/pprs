const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { login, getAllComplaints, getComplaintById, updateComplaintStatus, assignComplaint, getStats, getMapData, getDepartments } = require('../controllers/adminController');
const { upload } = require('../middleware/uploadMiddleware');  

router.post('/login', login);
router.use(protect);
router.get('/complaints', getAllComplaints);
router.get('/complaints/:id', getComplaintById);
router.patch('/complaints/:id/status', upload.single('resolutionImage'), updateComplaintStatus);
router.patch('/complaints/:id/assign', assignComplaint);
router.get('/stats', getStats);
router.get('/map', getMapData);
router.get('/departments', getDepartments);

module.exports = router;
