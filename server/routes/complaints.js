const express = require('express');
const router  = express.Router();
const { uploadImages }                          = require('../middleware/uploadMiddleware');
const { getCategories, submitComplaint, trackComplaint } = require('../controllers/complaintController');

router.get('/categories', getCategories);
router.post('/', uploadImages, submitComplaint);
router.get('/:complaintNo', trackComplaint);

module.exports = router;
