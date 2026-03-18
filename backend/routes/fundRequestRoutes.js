const express = require('express');
const router = express.Router();
const fundRequestController = require('../controllers/fundRequestController');

// Create a new fund request
router.post('/', fundRequestController.createFundRequest);

// Send fund request as message (must be before /:fundRequestId routes)
router.post('/message/send', fundRequestController.sendFundRequestMessage);

// Get fund requests for a user
router.get('/user/:userId', fundRequestController.getFundRequests);

// Get a specific fund request
router.get('/:fundRequestId', fundRequestController.getFundRequest);

// Approve a fund request
router.put('/:fundRequestId/approve', fundRequestController.approveFundRequest);

// Reject a fund request
router.put('/:fundRequestId/reject', fundRequestController.rejectFundRequest);

// Process payment for fund request
router.post('/:fundRequestId/payment', fundRequestController.processFundRequestPayment);

module.exports = router;
