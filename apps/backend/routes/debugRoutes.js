const express = require('express');
const router = express.Router();
const debugController = require('../controllers/debugController');

router.get('/benchmark', debugController.runBenchmark);

module.exports = router;
