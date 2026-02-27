# SMS Service

A generic backend service for sending SMS messages via Text.lk SMS Gateway. This service can be used by any module in the application.

## Configuration

Add the following environment variables to your `.env` file:

```env
# Text.lk SMS Gateway Configuration
TEXT_LK_API_BASE_URL=https://app.text.lk/api/v3
TEXT_LK_API_TOKEN=your_api_token_here
TEXT_LK_SENDER_ID=JobLoom
```

## Usage

### Importing the Service

```javascript
import * as smsService from '../../services/sms.service.js';
```

### Sending OTP

Perfect for authentication flows like user registration or login verification:

```javascript
// In user.service.js
import * as smsService from '../../services/sms.service.js';

export const sendOtpToUser = async (phoneNumber) => {
  const otp = generateOTP(); // Your OTP generation logic

  try {
    await smsService.sendOtp(phoneNumber, otp);
    console.log('OTP sent successfully');
  } catch (error) {
    console.error('Failed to send OTP:', error);
    throw error;
  }
};

// Custom OTP message with placeholder
await smsService.sendOtp(
  '94710000000',
  '123456',
  'Your verification code is {otp}. Valid for 10 minutes.'
);
```

### Sending Notifications

Use for application updates, reminders, or alerts:

```javascript
// In job.service.js
import * as smsService from '../../services/sms.service.js';

export const notifyJobAcceptance = async (userPhone, jobTitle) => {
  const message = `Congratulations! Your application for ${jobTitle} has been accepted.`;

  try {
    await smsService.sendNotification(userPhone, message);
  } catch (error) {
    console.error('Failed to send notification:', error);
  }
};

// In application.service.js
export const sendInterviewReminder = async (applicant, interviewDate) => {
  const message = `Reminder: You have an interview scheduled for ${interviewDate}. Good luck!`;
  await smsService.sendNotification(applicant.phone, message);
};
```

### Sending Custom SMS

For more control over the SMS parameters:

```javascript
import * as smsService from '../../services/sms.service.js';

// Send to single recipient
await smsService.sendSms({
  recipient: '94710000000',
  message: 'Your custom message here',
  type: 'plain', // plain, unicode, voice, mms, whatsapp, otp, viber
  sender_id: 'JobLoom', // Optional, defaults to env config
});

// Send to multiple recipients
await smsService.sendSms({
  recipient: '94710000000,94720000000,94730000000',
  message: 'Bulk message to multiple users',
  type: 'plain',
});

// Schedule SMS for later
await smsService.sendSms({
  recipient: '94710000000',
  message: 'Scheduled message',
  schedule_time: '2026-02-20 10:00', // Y-m-d H:i format
});
```

### Sending Campaign

Send SMS to contact lists:

```javascript
import * as smsService from '../../services/sms.service.js';

await smsService.sendCampaign({
  contact_list_id: '6415907d0d37a', // Single or comma-separated list IDs
  message: 'Campaign message to all contacts in list',
  type: 'plain',
});
```

### Viewing SMS/Campaign Status

```javascript
import * as smsService from '../../services/sms.service.js';

// View single SMS by UID
const smsDetails = await smsService.getSmsById('606812e63f78b');
console.log(smsDetails);

// View campaign details
const campaignDetails = await smsService.getCampaignById('606812e63f78b');
console.log(campaignDetails);

// View all messages with filters
const messages = await smsService.getAllMessages({
  start_date: '2026-02-01 00:00:00',
  end_date: '2026-02-15 23:59:59',
  sms_type: 'plain',
  direction: 'outgoing',
  timezone: 'Asia/Colombo',
  page: 1,
});
console.log(messages);
```

## API Functions

### `sendOtp(recipient, otp, message?)`

Send OTP verification code to a phone number.

- **recipient**: Phone number (e.g., '94710000000')
- **otp**: OTP code
- **message** (optional): Custom message with {otp} placeholder

### `sendNotification(recipient, message)`

Send notification SMS to a user.

- **recipient**: Phone number
- **message**: Notification message

### `sendSms(smsData)`

Send custom SMS with full control.

- **smsData.recipient**: Phone number(s), comma-separated for multiple
- **smsData.message**: SMS message body
- **smsData.type** (optional): Message type (default: 'plain')
- **smsData.sender_id** (optional): Sender ID (default: from config)
- **smsData.schedule_time** (optional): Schedule time (Y-m-d H:i)
- **smsData.dlt_template_id** (optional): DLT template ID

### `sendCampaign(campaignData)`

Send campaign to contact lists.

- **campaignData.contact_list_id**: Contact list ID(s)
- **campaignData.message**: Campaign message
- **campaignData.type** (optional): Message type
- **campaignData.sender_id** (optional): Sender ID
- **campaignData.schedule_time** (optional): Schedule time
- **campaignData.dlt_template_id** (optional): DLT template ID

### `getSmsById(uid)`

Get SMS details by UID.

### `getCampaignById(uid)`

Get campaign details by UID.

### `getAllMessages(filters?)`

Get all messages with optional filters.

- **filters.start_date**: Start date (YYYY-MM-DD HH:MM:SS)
- **filters.end_date**: End date (YYYY-MM-DD HH:MM:SS)
- **filters.sms_type**: SMS type filter
- **filters.direction**: Direction filter (outgoing/incoming/api)
- **filters.timezone**: Timezone for date filtering
- **filters.page**: Page number for pagination

## Error Handling

All functions throw `HttpException` on failure. Always wrap calls in try-catch:

```javascript
try {
  await smsService.sendOtp(phoneNumber, otp);
} catch (error) {
  if (error instanceof HttpException) {
    console.error(`SMS Error: ${error.message}`);
    // Handle specific error
  } else {
    console.error('Unexpected error:', error);
  }
}
```

## Example: User Registration with OTP

```javascript
// In user.service.js
import * as smsService from '../../services/sms.service.js';
import HttpException from '../../models/http-exception.js';

export const registerUser = async (userData) => {
  // Generate OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  // Save OTP to database/cache with expiry
  await saveOtpToCache(userData.phone, otp, 600); // 10 minutes

  // Send OTP via SMS
  try {
    await smsService.sendOtp(userData.phone, otp);
  } catch (error) {
    throw new HttpException(500, 'Failed to send verification code. Please try again.');
  }

  return { message: 'OTP sent to your phone number' };
};

export const verifyOtp = async (phone, otp) => {
  const cachedOtp = await getOtpFromCache(phone);

  if (!cachedOtp || cachedOtp !== otp) {
    throw new HttpException(400, 'Invalid or expired OTP');
  }

  // Clear OTP from cache
  await clearOtpFromCache(phone);

  // Complete registration...
  return { message: 'Phone number verified successfully' };
};
```

## Example: Job Application Notification

```javascript
// In application.service.js
import * as smsService from '../../services/sms.service.js';

export const acceptApplication = async (applicationId) => {
  const application = await getApplicationById(applicationId);

  // Update application status
  application.status = 'accepted';
  await application.save();

  // Notify applicant via SMS
  const message =
    `Your application for "${application.jobTitle}" has been accepted! ` +
    `The employer will contact you soon.`;

  try {
    await smsService.sendNotification(application.applicantPhone, message);
  } catch (error) {
    // Log error but don't fail the operation
    logger.error('Failed to send SMS notification:', error);
  }

  return application;
};
```

## Text.lk API Reference

For more details about the Text.lk API, visit: https://app.text.lk/api/docs
