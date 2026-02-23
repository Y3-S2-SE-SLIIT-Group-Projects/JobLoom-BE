import axios from 'axios';
import envConfig from '../config/env.config.js';
import HttpException from '../models/http-exception.js';
import logger from '../config/logger.config.js';

/**
 * SMS Service
 * Generic backend service for Text.lk SMS Gateway integration
 * This service can be imported and used by any other module/service
 * Example: User service can use sendOtp() for authentication
 */

/**
 * Get axios instance with Text.lk configuration
 * @returns {Object} Configured axios instance
 * @private
 */
const getAxiosInstance = () => {
  if (!envConfig.textLkApiToken) {
    throw new HttpException(500, 'Text.lk API token is not configured');
  }

  return axios.create({
    baseURL: envConfig.textLkApiBaseUrl,
    headers: {
      Authorization: `Bearer ${envConfig.textLkApiToken}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
  });
};

/**
 * Send SMS to single or multiple recipients
 * @param {Object} smsData - SMS data
 * @param {string} smsData.recipient - Phone number(s) to send message (comma-separated for multiple)
 * @param {string} smsData.message - The body of the SMS message
 * @param {string} [smsData.sender_id] - The sender ID (defaults to config)
 * @param {string} [smsData.type='plain'] - Message type (plain, unicode, voice, mms, whatsapp, otp, viber)
 * @param {string} [smsData.schedule_time] - Schedule time in format (Y-m-d H:i)
 * @param {string} [smsData.dlt_template_id] - DLT template ID
 * @returns {Promise<Object>} SMS send response
 */
export const sendSms = async (smsData) => {
  try {
    const axiosInstance = getAxiosInstance();

    const payload = {
      recipient: smsData.recipient,
      sender_id: smsData.sender_id || envConfig.textLkSenderId,
      type: smsData.type || 'plain',
      message: smsData.message,
    };

    // Add optional fields if provided
    if (smsData.schedule_time) {
      payload.schedule_time = smsData.schedule_time;
    }
    if (smsData.dlt_template_id) {
      payload.dlt_template_id = smsData.dlt_template_id;
    }

    logger.info('Sending SMS', { recipient: payload.recipient });

    const response = await axiosInstance.post('/sms/send', payload);

    if (response.data.status === 'success') {
      logger.info('SMS sent successfully', { recipient: payload.recipient });
      return response.data;
    } else {
      throw new HttpException(400, response.data.message || 'Failed to send SMS');
    }
  } catch (error) {
    if (error instanceof HttpException) {
      throw error;
    }

    logger.error('Error sending SMS', { error: error.message });

    if (error.response) {
      throw new HttpException(
        error.response.status,
        error.response.data?.message || 'Failed to send SMS'
      );
    }

    throw new HttpException(500, 'Failed to send SMS');
  }
};

/**
 * Send campaign using contact list
 * @param {Object} campaignData - Campaign data
 * @param {string} campaignData.contact_list_id - Contact list ID(s) (comma-separated for multiple)
 * @param {string} campaignData.message - The body of the SMS message
 * @param {string} [campaignData.sender_id] - The sender ID (defaults to config)
 * @param {string} [campaignData.type='plain'] - Message type
 * @param {string} [campaignData.schedule_time] - Schedule time in format (Y-m-d H:i)
 * @param {string} [campaignData.dlt_template_id] - DLT template ID
 * @returns {Promise<Object>} Campaign send response
 */
export const sendCampaign = async (campaignData) => {
  try {
    const axiosInstance = getAxiosInstance();

    const payload = {
      recipient: campaignData.contact_list_id,
      sender_id: campaignData.sender_id || envConfig.textLkSenderId,
      type: campaignData.type || 'plain',
      message: campaignData.message,
    };

    // Add optional fields if provided
    if (campaignData.schedule_time) {
      payload.schedule_time = campaignData.schedule_time;
    }
    if (campaignData.dlt_template_id) {
      payload.dlt_template_id = campaignData.dlt_template_id;
    }

    logger.info('Sending campaign', { contact_list_id: payload.recipient });

    const response = await axiosInstance.post('/sms/campaign', payload);

    if (response.data.status === 'success') {
      logger.info('Campaign sent successfully', { contact_list_id: payload.recipient });
      return response.data;
    } else {
      throw new HttpException(400, response.data.message || 'Failed to send campaign');
    }
  } catch (error) {
    if (error instanceof HttpException) {
      throw error;
    }

    logger.error('Error sending campaign', { error: error.message });

    if (error.response) {
      throw new HttpException(
        error.response.status,
        error.response.data?.message || 'Failed to send campaign'
      );
    }

    throw new HttpException(500, 'Failed to send campaign');
  }
};

/**
 * View an SMS by UID
 * @param {string} uid - Unique message ID
 * @returns {Promise<Object>} SMS details
 */
export const getSmsById = async (uid) => {
  try {
    const axiosInstance = getAxiosInstance();

    logger.info('Fetching SMS', { uid });

    const response = await axiosInstance.get(`/sms/${uid}`);

    if (response.data.status === 'success') {
      return response.data;
    } else {
      throw new HttpException(404, response.data.message || 'SMS not found');
    }
  } catch (error) {
    if (error instanceof HttpException) {
      throw error;
    }

    logger.error('Error fetching SMS', { uid, error: error.message });

    if (error.response) {
      throw new HttpException(
        error.response.status,
        error.response.data?.message || 'Failed to fetch SMS'
      );
    }

    throw new HttpException(500, 'Failed to fetch SMS');
  }
};

/**
 * View all messages with optional filters
 * @param {Object} [filters={}] - Query filters
 * @param {string} [filters.start_date] - Start date (YYYY-MM-DD HH:MM:SS)
 * @param {string} [filters.end_date] - End date (YYYY-MM-DD HH:MM:SS)
 * @param {string} [filters.sms_type] - SMS type (plain, unicode, voice, mms, whatsapp, otp, viber)
 * @param {string} [filters.direction] - Direction (outgoing, incoming, api)
 * @param {string} [filters.timezone] - Timezone (e.g., Asia/Colombo, UTC)
 * @param {number} [filters.page] - Page number for pagination
 * @returns {Promise<Object>} List of messages with pagination
 */
export const getAllMessages = async (filters = {}) => {
  try {
    const axiosInstance = getAxiosInstance();

    const params = {};

    // Add optional filters
    if (filters.start_date) params.start_date = filters.start_date;
    if (filters.end_date) params.end_date = filters.end_date;
    if (filters.sms_type) params.sms_type = filters.sms_type;
    if (filters.direction) params.direction = filters.direction;
    if (filters.timezone) params.timezone = filters.timezone;
    if (filters.page) params.page = filters.page;

    logger.info('Fetching all messages', { filters: params });

    const response = await axiosInstance.get('/sms', { params });

    if (response.data.status === 'success') {
      return response.data;
    } else {
      throw new HttpException(400, response.data.message || 'Failed to fetch messages');
    }
  } catch (error) {
    if (error instanceof HttpException) {
      throw error;
    }

    logger.error('Error fetching messages', { error: error.message });

    if (error.response) {
      throw new HttpException(
        error.response.status,
        error.response.data?.message || 'Failed to fetch messages'
      );
    }

    throw new HttpException(500, 'Failed to fetch messages');
  }
};

/**
 * View a campaign by UID
 * @param {string} uid - Unique campaign ID
 * @returns {Promise<Object>} Campaign details
 */
export const getCampaignById = async (uid) => {
  try {
    const axiosInstance = getAxiosInstance();

    logger.info('Fetching campaign', { uid });

    const response = await axiosInstance.get(`/campaign/${uid}/view`);

    if (response.data.status === 'success') {
      return response.data;
    } else {
      throw new HttpException(404, response.data.message || 'Campaign not found');
    }
  } catch (error) {
    if (error instanceof HttpException) {
      throw error;
    }

    logger.error('Error fetching campaign', { uid, error: error.message });

    if (error.response) {
      throw new HttpException(
        error.response.status,
        error.response.data?.message || 'Failed to fetch campaign'
      );
    }

    throw new HttpException(500, 'Failed to fetch campaign');
  }
};

/**
 * Send OTP SMS
 * Use this in authentication flows (e.g., user registration, login verification)
 *
 * @param {string} recipient - Phone number (e.g., 94710000000)
 * @param {string} otp - OTP code
 * @param {string} [message] - Custom message (use {otp} placeholder, defaults to standard template)
 * @returns {Promise<Object>} SMS send response
 *
 * @example
 * // In user.service.js:
 * import * as smsService from '../../services/sms.service.js';
 *
 * const otp = generateOTP();
 * await smsService.sendOtp('94710000000', otp);
 */
export const sendOtp = async (recipient, otp, message = null) => {
  const defaultMessage = `Your JobLoom verification code is: ${otp}. Do not share this code with anyone.`;
  const otpMessage = message ? message.replace('{otp}', otp) : defaultMessage;

  return await sendSms({
    recipient,
    message: otpMessage,
    type: 'plain',
  });
};

/**
 * Send notification SMS
 * Use this for sending notifications to users (e.g., job application updates, interview reminders)
 *
 * @param {string} recipient - Phone number (e.g., 94710000000)
 * @param {string} message - Notification message
 * @returns {Promise<Object>} SMS send response
 *
 * @example
 * // In job.service.js:
 * import * as smsService from '../../services/sms.service.js';
 *
 * await smsService.sendNotification(
 *   '94710000000',
 *   'Your job application for Software Engineer has been accepted!'
 * );
 */
export const sendNotification = async (recipient, message) => {
  return await sendSms({
    recipient,
    message,
    type: 'plain',
  });
};
