"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.startReservationCronJobs = startReservationCronJobs;
const cron = __importStar(require("node-cron"));
const reservationService_1 = require("../services/reservationService");
/**
 * Cron job chạy mỗi 10 phút để:
 * 1. Xử lý reservation hết hạn
 * 2. Gửi email nhắc nhở reservation sắp hết hạn
 */
function startReservationCronJobs() {
    // Chạy mỗi 10 phút
    cron.schedule('*/10 * * * *', async () => {
        console.log('Running reservation cron job at', new Date().toISOString());
        try {
            // Xử lý reservation hết hạn
            const expireResult = await (0, reservationService_1.expireReservations)();
            if (expireResult.totalExpired > 0) {
                console.log(`Expired ${expireResult.totalExpired} reservations`);
            }
            // Gửi email nhắc nhở reservation sắp hết hạn
            await (0, reservationService_1.sendExpiryReminders)();
            console.log('Reservation cron job completed successfully');
        }
        catch (error) {
            console.error('Error in reservation cron job:', error);
        }
    });
    console.log('Reservation cron jobs started');
}
//# sourceMappingURL=reservationCronJobs.js.map