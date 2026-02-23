import envConfig from '../config/env.config.js';

/**
 * SMS Service to send messages via Text.lk
 */
class SMSService {
  constructor() {
    this.baseUrl = envConfig.smsApiBaseUrl;
    this.apiToken = envConfig.smsApiToken;
    this.senderId = envConfig.smsSenderId;
  }

  getFetch() {
    if (typeof globalThis.fetch !== 'function') {
      throw new Error(
        'Global fetch is not available in this Node.js runtime. Use Node.js 18+ or provide a fetch polyfill.'
      );
    }
    return globalThis.fetch;
  }

  /**
   * Send an SMS message
   * @param {string} phone - Recipient phone number (e.g., 94771234567)
   * @param {string} message - Message content
   * @returns {Promise<Object>} API response
   */
  async sendSMS(phone, message) {
    try {
      // Ensure phone is in the correct format (remove leading 0 and add 94 if needed)
      let formattedPhone = phone.replace(/[^0-9]/g, '');
      if (formattedPhone.startsWith('0')) {
        formattedPhone = '94' + formattedPhone.substring(1);
      } else if (!formattedPhone.startsWith('94') && formattedPhone.length === 9) {
        formattedPhone = '94' + formattedPhone;
      }

      const fetchFn = this.getFetch();
      const response = await fetchFn(`${this.baseUrl}sms/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiToken}`,
          Accept: 'application/json',
        },
        body: JSON.stringify({
          recipient: formattedPhone,
          sender_id: this.senderId,
          message: message,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('SMS API Error:', data);
        throw new Error(data.message || 'Failed to send SMS');
      }

      return data;
    } catch (error) {
      console.error('SMS Service Error:', error);
      throw error;
    }
  }

  /**
   * Send OTP for verification
   * @param {string} phone
   * @param {string} otp
   */
  async sendOTP(phone, otp) {
    const message = `Your JobLoom verification code is: ${otp}. Valid for 10 minutes.`;
    return this.sendSMS(phone, message);
  }

  /**
   * Send OTP for password reset
   * @param {string} phone
   * @param {string} otp
   */
  async sendPasswordResetOTP(phone, otp) {
    const message = `Your JobLoom password reset code is: ${otp}. Valid for 10 minutes.`;
    return this.sendSMS(phone, message);
  }
}

export default new SMSService();
