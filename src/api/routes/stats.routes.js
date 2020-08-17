const express = require('express');
const router = express.Router();
const controller = require('../controllers/stats.controllers');

router.get('/', controller.getStats);

module.exports = router;