const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');

// Add metrics for a startup
router.post('/startup/metrics', analyticsController.addMetrics);

// Get all metrics for a startup
router.get('/startup/:startup_id/metrics', analyticsController.getStartupMetrics);

// Get metrics for a specific period
router.get('/startup/:startup_id/metrics/:period', analyticsController.getMetricsByPeriod);

// Update metrics
router.put('/startup/metrics', analyticsController.updateMetrics);

// Delete metrics for a period
router.delete('/startup/:startup_id/metrics/:period', analyticsController.deleteMetrics);

// Get startups by domain
router.get('/startups', analyticsController.getStartupsByDomain);

module.exports = router;
