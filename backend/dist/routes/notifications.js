"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const notificationController_1 = require("../controllers/notificationController");
const notificationPreferenceController_1 = require("../controllers/notificationPreferenceController");
const router = (0, express_1.Router)();
router.use(auth_1.authMiddleware);
router.get('/preferences', notificationPreferenceController_1.getNotificationPreferences);
router.put('/preferences', notificationPreferenceController_1.updateNotificationPreferences);
router.get('/', notificationController_1.getNotifications);
router.patch('/read-all', notificationController_1.markAllNotificationsRead);
router.patch('/:id/read', notificationController_1.markNotificationRead);
exports.default = router;
//# sourceMappingURL=notifications.js.map