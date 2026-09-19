import * as whatsappService from './whatsappService';
export type { BookingNotificationPayload } from './whatsappService';

export const formatSriLankanPhone = whatsappService.formatSriLankanPhoneJid;
export const sendWhatsAppETicket = whatsappService.sendWhatsAppETicket;
export const sendWhatsAppOtp = whatsappService.sendWhatsAppOtp;
export const sendWhatsAppPaymentUpdate = whatsappService.sendWhatsAppPaymentUpdate;
export const getWhatsAppStatus = whatsappService.getWhatsAppStatus;
export const restartWhatsAppSession = whatsappService.restartWhatsAppSession;
export const sendWhatsAppMessage = whatsappService.sendWhatsAppMessage;
export const sendWhatsAppDepartureReminder = whatsappService.sendWhatsAppDepartureReminder;
export const initWhatsApp = whatsappService.initWhatsApp;
