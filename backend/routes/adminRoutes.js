const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');

/**
 * @swagger
 * tags:
 *   name: Admin
 *   description: System administration and dashboard APIs
 */

/**
 * @swagger
 * /api/admin/dashboard:
 *   get:
 *     summary: Retrieve admin dashboard data
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard statistics successfully retrieved
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 *       500:
 *         description: Server error
 */
router.get('/dashboard', authMiddleware, adminMiddleware, adminController.getAdminDashboardData);

module.exports = router;
