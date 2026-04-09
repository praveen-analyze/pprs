const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const { uploadChatPhoto } = require('../middleware/uploadMiddleware');

router.post('/', uploadChatPhoto, chatController.handleChat);

module.exports = router;
