import nodemailer from 'nodemailer';
import envConfig from '../config/env.config.js';
import logger from '../config/logger.config.js';

/** @type {import('nodemailer').Transporter | null} */
let transporter = null;

/**
 * Escape text for safe insertion into HTML email bodies
 * @param {unknown} value
 * @returns {string}
 */
const escapeHtml = (value) => {
  if (value == null || value === '') return '';
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
};

/**
 * @param {Date|string} value
 * @returns {string}
 */
const formatInterviewDateTime = (value) => {
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleString('en-LK', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short',
  });
};

/** Title-case enum-style tokens for display (e.g. full_time → Full Time) */
const humanizeToken = (value) => {
  if (value == null || value === '') return '';
  return String(value)
    .replace(/_/g, ' ')
    .replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.slice(1).toLowerCase());
};

const preheaderBlock = (text) => {
  const t = escapeHtml(text);
  return `<div style="display:none;font-size:1px;color:#f8fafc;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;mso-hide:all;">${t}</div>`;
};

/**
 * @param {string} innerHtml
 * @param {{ preheader?: string }} [options]
 */
const baseLayout = (innerHtml, options = {}) => {
  const { preheader = '' } = options;
  const brand = escapeHtml(envConfig.smtpFromName);
  const year = new Date().getFullYear();
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="x-ua-compatible" content="ie=edge">
  <title>${brand}</title>
</head>
<body style="margin:0;padding:0;background-color:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
  ${preheader ? preheaderBlock(preheader) : ''}
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#f1f5f9;padding:36px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:600px;">
          <tr>
            <td style="padding:0 4px 18px 4px;text-align:center;">
              <span style="font-size:13px;font-weight:700;letter-spacing:0.16em;text-transform:uppercase;color:#64748b;">${brand}</span>
            </td>
          </tr>
          <tr>
            <td style="background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(15,23,42,0.08);border:1px solid #e2e8f0;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td style="height:4px;background-color:#2563eb;font-size:0;line-height:0;">&nbsp;</td>
                </tr>
                <tr>
                  <td style="padding:32px 36px 28px 36px;color:#334155;font-size:16px;line-height:1.65;">
                    ${innerHtml}
                  </td>
                </tr>
                <tr>
                  <td style="padding:22px 36px 26px 36px;background-color:#f8fafc;border-top:1px solid #e2e8f0;">
                    <p style="margin:0 0 10px 0;font-size:13px;line-height:1.55;color:#64748b;">You received this because you have an account on <strong style="color:#475569;">${brand}</strong>. Hiring-related updates are sent for transparency. Please do not reply directly to this address—use in-app messaging where available.</p>
                    <p style="margin:0;font-size:12px;color:#94a3b8;">© ${year} ${brand}. All rights reserved.</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
};

const button = (href, label) => {
  const safeHref = escapeHtml(href);
  const safeLabel = escapeHtml(label);
  return `
  <table role="presentation" cellspacing="0" cellpadding="0" style="margin:24px 0 0 0;">
    <tr>
      <td style="border-radius:10px;background-color:#2563eb;">
        <a href="${safeHref}" target="_blank" rel="noopener noreferrer"
           style="display:inline-block;padding:14px 28px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:10px;">
          ${safeLabel}
        </a>
      </td>
    </tr>
  </table>`;
};

const textLinkBelow = (href, label) => {
  const safeHref = escapeHtml(href);
  const safeLabel = escapeHtml(label);
  return `<p style="margin:16px 0 0 0;font-size:14px;line-height:1.5;"><a href="${safeHref}" target="_blank" rel="noopener noreferrer" style="color:#2563eb;font-weight:600;text-decoration:none;">${safeLabel} →</a></p>`;
};

const emailSignoff = () => {
  const brand = escapeHtml(envConfig.smtpFromName);
  return `<p style="margin:28px 0 0 0;padding-top:22px;border-top:1px solid #e2e8f0;font-size:14px;color:#64748b;line-height:1.6;">Best regards,<br/><span style="color:#0f172a;font-weight:600;">The ${brand} Team</span></p>`;
};

/**
 * Seeker/applicant contact (email + phone) shown for record-keeping
 */
const profileContactPanel = (heading, email, phone) => {
  const e = email != null ? String(email).trim() : '';
  const p = phone != null ? String(phone).trim() : '';
  if (!e && !p) return '';
  let inner = '';
  if (e) {
    inner += detailField(
      'Email',
      `<a href="mailto:${escapeHtml(e)}" style="color:#2563eb;text-decoration:none;font-weight:500;">${escapeHtml(e)}</a>`
    );
  }
  if (p) inner += detailField('Phone', escapeHtml(p));
  return detailPanel(heading, inner);
};

/** Employer / hiring-side contact for the candidate to reach out */
const hiringContactPanel = (contactName, email, phone) => {
  const n = contactName != null ? String(contactName).trim() : '';
  const e = email != null ? String(email).trim() : '';
  const p = phone != null ? String(phone).trim() : '';
  if (!n && !e && !p) return '';
  let inner = '';
  if (n) inner += detailField('Contact name', escapeHtml(n));
  if (e) {
    inner += detailField(
      'Email',
      `<a href="mailto:${escapeHtml(e)}" style="color:#2563eb;text-decoration:none;font-weight:500;">${escapeHtml(e)}</a>`
    );
  }
  if (p) inner += detailField('Phone', escapeHtml(p));
  return detailPanel('Company / employer contact', inner);
};

/** Candidate contact for employer-facing emails */
const candidateContactPanel = (name, email, phone) => {
  const n = name != null ? String(name).trim() : '';
  const e = email != null ? String(email).trim() : '';
  const p = phone != null ? String(phone).trim() : '';
  if (!n && !e && !p) return '';
  let inner = '';
  if (n) inner += detailField('Candidate name', escapeHtml(n));
  if (e) {
    inner += detailField(
      'Email',
      `<a href="mailto:${escapeHtml(e)}" style="color:#2563eb;text-decoration:none;font-weight:500;">${escapeHtml(e)}</a>`
    );
  }
  if (p) inner += detailField('Phone', escapeHtml(p));
  return detailPanel('Candidate contact', inner);
};

/**
 * Prominent job context block — role, company, category, listing status, optional party line
 */
const jobSummaryCard = ({
  eyebrow,
  jobTitle,
  companyDisplayName,
  jobCategory,
  jobListingStatus,
  partyLabel,
  partyName,
}) => {
  const company = companyDisplayName != null ? String(companyDisplayName).trim() : '';
  const cat = jobCategory ? humanizeToken(jobCategory) : '';
  const listing = jobListingStatus ? humanizeToken(jobListingStatus) : '';
  let rows = '';
  if (company) {
    rows += `<tr><td style="padding:10px 0 0 0;border-top:1px solid rgba(148,163,184,0.35);"><span style="display:block;font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#94a3b8;">Company</span><span style="display:block;margin-top:4px;font-size:15px;color:#e2e8f0;">${escapeHtml(company)}</span></td></tr>`;
  }
  if (cat) {
    rows += `<tr><td style="padding:10px 0 0 0;border-top:1px solid rgba(148,163,184,0.35);"><span style="display:block;font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#94a3b8;">Category</span><span style="display:block;margin-top:4px;font-size:15px;color:#e2e8f0;">${escapeHtml(cat)}</span></td></tr>`;
  }
  if (listing) {
    rows += `<tr><td style="padding:10px 0 0 0;border-top:1px solid rgba(148,163,184,0.35);"><span style="display:block;font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#94a3b8;">Job listing</span><span style="display:block;margin-top:4px;font-size:15px;color:#e2e8f0;">${escapeHtml(listing)}</span></td></tr>`;
  }
  if (partyLabel && partyName) {
    rows += `<tr><td style="padding:10px 0 0 0;border-top:1px solid rgba(148,163,184,0.35);"><span style="display:block;font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#94a3b8;">${escapeHtml(partyLabel)}</span><span style="display:block;margin-top:4px;font-size:15px;color:#e2e8f0;">${escapeHtml(partyName)}</span></td></tr>`;
  }
  return `
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:0 0 26px 0;background-color:#0f172a;border-radius:14px;">
    <tr>
      <td style="padding:22px 24px;">
        <p style="margin:0 0 8px;font-size:11px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:#60a5fa;">${escapeHtml(eyebrow)}</p>
        <p style="margin:0 0 14px;font-size:22px;font-weight:700;line-height:1.3;color:#ffffff;letter-spacing:-0.02em;">${escapeHtml(jobTitle)}</p>
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0">${rows}</table>
      </td>
    </tr>
  </table>`;
};

const detailPanel = (title, innerRowsHtml) => `
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:0 0 18px 0;background-color:#f8fafc;border-radius:12px;border:1px solid #e2e8f0;">
    <tr>
      <td style="padding:20px 22px;">
        <p style="margin:0 0 14px;font-size:12px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#64748b;">${escapeHtml(title)}</p>
        ${innerRowsHtml}
      </td>
    </tr>
  </table>`;

const detailField = (label, valueHtml) => `
  <p style="margin:0 0 4px 0;font-size:11px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;color:#64748b;">${escapeHtml(label)}</p>
  <div style="margin:0 0 16px 0;font-size:16px;color:#0f172a;font-weight:500;line-height:1.45;">${valueHtml}</div>`;

/** SMTP From header (authenticated mailbox + display name) */
const mailFrom = () => `"${envConfig.smtpFromName}" <${envConfig.smtpFromEmail}>`;

/**
 * Lazy singleton Nodemailer transporter (SMTP)
 * @returns {import('nodemailer').Transporter | null}
 */
const getTransporter = () => {
  if (!envConfig.isSmtpConfigured) {
    return null;
  }
  if (transporter) {
    return transporter;
  }
  transporter = nodemailer.createTransport({
    host: envConfig.smtpHost,
    port: envConfig.smtpPort,
    secure: envConfig.smtpPort === 465,
    auth: {
      user: envConfig.smtpUser,
      pass: envConfig.smtpPass,
    },
  });
  return transporter;
};

/**
 * @typedef {Object} SendResult
 * @property {boolean} sent
 * @property {boolean} [skipped]
 * @property {string} [reason]
 * @property {string} [messageId]
 */

/**
 * Notify job seeker that an interview was scheduled (virtual or in-person)
 * @param {Object} params
 * @param {string} params.to - Recipient email
 * @param {string} params.seekerName
 * @param {string} params.employerName
 * @param {string} params.jobTitle
 * @param {Date|string} params.interviewDate
 * @param {'virtual'|'in_person'} params.interviewType
 * @param {number} [params.interviewDuration] - minutes
 * @param {string} [params.interviewLocation]
 * @param {string} [params.interviewLocationNotes]
 * @param {string} [params.joinUrl] - Virtual: full URL to open interview in app (preferred)
 * @param {string} [params.applicationId] - Used with FRONTEND_URL if joinUrl omitted
 * @param {string} [params.jobCategory] - Job category (e.g. from listing)
 * @param {string} [params.jobListingStatus] - Job document status
 * @param {string} [params.viewApplicationUrl] - Link to seeker's application detail in app
 * @returns {Promise<SendResult>}
 */
export const sendInterviewScheduledEmail = async ({
  to,
  seekerName,
  seekerEmailOnFile,
  seekerPhone,
  employerName,
  employerEmail,
  employerPhone,
  companyDisplayName,
  jobTitle,
  jobCategory,
  jobListingStatus,
  interviewDate,
  interviewType,
  interviewDuration,
  interviewLocation,
  interviewLocationNotes,
  joinUrl,
  applicationId,
  viewApplicationUrl,
}) => {
  const transport = getTransporter();
  if (!transport) {
    logger.warn('Email skipped: SMTP is not configured', { to, type: 'interview_scheduled' });
    return { sent: false, skipped: true, reason: 'smtp_not_configured' };
  }

  const resolvedJoinUrl =
    joinUrl ||
    (applicationId && envConfig.frontendUrl
      ? `${envConfig.frontendUrl.replace(/\/$/, '')}/interview/${applicationId}`
      : null);

  const when = formatInterviewDateTime(interviewDate);
  const durationLabel =
    interviewDuration != null ? `${interviewDuration} minutes` : '30 minutes (default)';

  const isVirtual = interviewType === 'virtual';
  const formatLabel = isVirtual ? 'Virtual (video)' : 'In person';
  const subject = isVirtual
    ? `Interview confirmed — ${jobTitle} (virtual)`
    : `Interview confirmed — ${jobTitle} (in person)`;

  const preheader = `${employerName} scheduled your interview for ${jobTitle}. ${when}`;

  const scheduleInner = `${detailField('Date & time', escapeHtml(when))}${detailField('Duration', escapeHtml(durationLabel))}${detailField('Format', escapeHtml(formatLabel))}`;

  let textDetails = `Hi ${seekerName},\n\n${employerName} has scheduled an interview with you.\n\nPOSITION\n${jobTitle}\n`;
  if (companyDisplayName) textDetails += `Company: ${companyDisplayName}\n`;
  if (jobCategory) textDetails += `Category: ${humanizeToken(jobCategory)}\n`;
  if (jobListingStatus) textDetails += `Listing status: ${humanizeToken(jobListingStatus)}\n`;
  textDetails += `\nYOUR CONTACT (ON FILE)\n`;
  if (seekerEmailOnFile) textDetails += `Email: ${seekerEmailOnFile}\n`;
  if (seekerPhone) textDetails += `Phone: ${seekerPhone}\n`;
  textDetails += `\nEMPLOYER CONTACT\n`;
  if (employerName) textDetails += `Name: ${employerName}\n`;
  if (employerEmail) textDetails += `Email: ${employerEmail}\n`;
  if (employerPhone) textDetails += `Phone: ${employerPhone}\n`;
  textDetails += `\nSCHEDULE\nWhen: ${when}\nDuration: ${durationLabel}\nFormat: ${formatLabel}\n`;

  let detailsHtml = `
    <p style="margin:0 0 14px 0;font-size:17px;color:#0f172a;font-weight:600;">Hi ${escapeHtml(seekerName)},</p>
    <p style="margin:0 0 22px 0;color:#475569;line-height:1.6;"><strong style="color:#0f172a;">${escapeHtml(employerName)}</strong> has scheduled an interview for the role below. Please add this to your calendar and join on time. If you need to reschedule, contact the employer through ${escapeHtml(envConfig.smtpFromName)}.</p>
    ${jobSummaryCard({
      eyebrow: 'Open position',
      jobTitle,
      companyDisplayName,
      jobCategory,
      jobListingStatus,
      partyLabel: 'Hiring contact',
      partyName: employerName,
    })}
    ${profileContactPanel('Your contact (on file with this application)', seekerEmailOnFile, seekerPhone)}
    ${hiringContactPanel(employerName, employerEmail, employerPhone)}
    ${detailPanel('Interview schedule', scheduleInner)}`;

  if (isVirtual) {
    detailsHtml += `<p style="margin:0 0 8px 0;color:#475569;line-height:1.6;">At the scheduled time, use the primary button below to open your secure video room. Test your camera and microphone a few minutes early.</p>`;
    textDetails += '\nJoin using the video link below at the scheduled time.\n';
    if (resolvedJoinUrl) {
      detailsHtml += button(resolvedJoinUrl, 'Join video interview');
      textDetails += `\nJoin interview: ${resolvedJoinUrl}\n`;
    } else {
      detailsHtml += `<p style="margin:12px 0 0 0;padding:12px 14px;background-color:#fffbeb;border-radius:10px;border:1px solid #fde68a;font-size:14px;color:#92400e;line-height:1.5;">We could not include a direct link. Sign in to ${escapeHtml(envConfig.smtpFromName)} and open <strong>My applications</strong> to join when it is time.</p>`;
      textDetails += '\nOpen the app → My applications → this job to join when it is time.\n';
    }
  } else {
    detailsHtml += detailPanel(
      'Interview location',
      detailField('Address', escapeHtml(interviewLocation || '—'))
    );
    textDetails += `\nLocation: ${interviewLocation || '—'}\n`;
    if (interviewLocationNotes) {
      detailsHtml += detailPanel(
        'Instructions from the employer',
        `<p style="margin:0;white-space:pre-wrap;font-size:15px;color:#0f172a;line-height:1.55;">${escapeHtml(interviewLocationNotes)}</p>`
      );
      textDetails += `Instructions: ${interviewLocationNotes}\n`;
    }
    detailsHtml += `<p style="margin:0 0 8px 0;color:#475569;line-height:1.6;">Arrive a few minutes early if possible. Bring a copy of your CV if the employer requested it.</p>`;
    if (interviewLocation) {
      const mapsUrl = `https://maps.google.com/?q=${encodeURIComponent(interviewLocation)}`;
      detailsHtml += button(mapsUrl, 'Open in Google Maps');
      textDetails += `\nDirections: ${mapsUrl}\n`;
    }
  }

  if (viewApplicationUrl) {
    detailsHtml += textLinkBelow(viewApplicationUrl, 'View full application & timeline');
    textDetails += `\nApplication details: ${viewApplicationUrl}\n`;
  }

  detailsHtml += emailSignoff();

  const html = baseLayout(detailsHtml, { preheader });
  const text = textDetails;

  try {
    const info = await transport.sendMail({
      from: mailFrom(),
      to,
      subject,
      text,
      html,
    });
    logger.info('Interview scheduled email sent', { to, messageId: info.messageId });
    return { sent: true, messageId: info.messageId };
  } catch (err) {
    logger.error('Failed to send interview scheduled email', {
      to,
      error: err.message,
    });
    throw err;
  }
};

/**
 * Confirmation to employer after scheduling an interview (same facts as seeker email)
 * @param {Object} params
 * @param {string} params.to - Employer email
 * @param {string} params.employerName
 * @param {string} params.seekerName
 * @param {string} params.jobTitle
 * @param {Date|string} params.interviewDate
 * @param {'virtual'|'in_person'} params.interviewType
 * @param {number} [params.interviewDuration]
 * @param {string} [params.interviewLocation]
 * @param {string} [params.interviewLocationNotes]
 * @param {string} [params.joinUrl]
 * @param {string} [params.applicationId]
 * @param {string} [params.jobCategory]
 * @param {string} [params.jobListingStatus]
 * @param {string} [params.manageApplicationUrl] - Employer application detail in app
 * @returns {Promise<SendResult>}
 */
export const sendEmployerInterviewScheduledEmail = async ({
  to,
  employerName,
  seekerName,
  seekerEmailOnFile,
  seekerPhone,
  companyDisplayName,
  jobTitle,
  jobCategory,
  jobListingStatus,
  interviewDate,
  interviewType,
  interviewDuration,
  interviewLocation,
  interviewLocationNotes,
  joinUrl,
  applicationId,
  manageApplicationUrl,
}) => {
  const transport = getTransporter();
  if (!transport) {
    logger.warn('Email skipped: SMTP is not configured', {
      to,
      type: 'employer_interview_scheduled',
    });
    return { sent: false, skipped: true, reason: 'smtp_not_configured' };
  }

  const resolvedJoinUrl =
    joinUrl ||
    (applicationId && envConfig.frontendUrl
      ? `${envConfig.frontendUrl.replace(/\/$/, '')}/interview/${applicationId}`
      : null);

  const when = formatInterviewDateTime(interviewDate);
  const durationLabel =
    interviewDuration != null ? `${interviewDuration} minutes` : '30 minutes (default)';
  const isVirtual = interviewType === 'virtual';
  const formatLabel = isVirtual ? 'Virtual (video)' : 'In person';
  const subject = `Confirmation: interview set — ${jobTitle} · ${seekerName}`;
  const preheader = `You scheduled ${seekerName} for ${when}. Role: ${jobTitle}.`;

  const scheduleInner = `${detailField('Date & time', escapeHtml(when))}${detailField('Duration', escapeHtml(durationLabel))}${detailField('Format', escapeHtml(formatLabel))}`;

  let textDetails = `Hi ${employerName},\n\nThis confirms the interview you set up in ${envConfig.smtpFromName}.\n\nROLE\n${jobTitle}\n`;
  if (companyDisplayName) textDetails += `Company: ${companyDisplayName}\n`;
  if (jobCategory) textDetails += `Category: ${humanizeToken(jobCategory)}\n`;
  if (jobListingStatus) textDetails += `Listing status: ${humanizeToken(jobListingStatus)}\n`;
  textDetails += `\nCANDIDATE CONTACT\nName: ${seekerName}\n`;
  if (seekerEmailOnFile) textDetails += `Email: ${seekerEmailOnFile}\n`;
  if (seekerPhone) textDetails += `Phone: ${seekerPhone}\n`;
  textDetails += `\nSCHEDULE\nWhen: ${when}\nDuration: ${durationLabel}\nFormat: ${formatLabel}\n`;

  let detailsHtml = `
    <p style="margin:0 0 14px 0;font-size:17px;color:#0f172a;font-weight:600;">Hi ${escapeHtml(employerName)},</p>
    <p style="margin:0 0 22px 0;color:#475569;line-height:1.6;">This is your confirmation copy. The candidate has been sent a matching email with the same schedule. Keep this message for your records.</p>
    ${jobSummaryCard({
      eyebrow: 'Role you are hiring for',
      jobTitle,
      companyDisplayName,
      jobCategory,
      jobListingStatus,
      partyLabel: 'Candidate',
      partyName: seekerName,
    })}
    ${candidateContactPanel(seekerName, seekerEmailOnFile, seekerPhone)}
    ${detailPanel('Interview schedule', scheduleInner)}`;

  if (isVirtual) {
    detailsHtml += `<p style="margin:0 0 8px 0;color:#475569;line-height:1.6;">Use the same secure video room as the applicant. Join a few minutes early to admit them from the waiting area if your platform uses one.</p>`;
    textDetails += '\nVirtual interview — use the employer join link below.\n';
    if (resolvedJoinUrl) {
      detailsHtml += button(resolvedJoinUrl, 'Open employer video room');
      textDetails += `\nJoin interview: ${resolvedJoinUrl}\n`;
    }
  } else {
    detailsHtml += detailPanel(
      'Venue',
      detailField('Address', escapeHtml(interviewLocation || '—'))
    );
    textDetails += `\nLocation: ${interviewLocation || '—'}\n`;
    if (interviewLocationNotes) {
      detailsHtml += detailPanel(
        'Notes shared with the candidate',
        `<p style="margin:0;white-space:pre-wrap;font-size:15px;color:#0f172a;line-height:1.55;">${escapeHtml(interviewLocationNotes)}</p>`
      );
      textDetails += `Notes: ${interviewLocationNotes}\n`;
    }
    if (interviewLocation) {
      const mapsUrl = `https://maps.google.com/?q=${encodeURIComponent(interviewLocation)}`;
      detailsHtml += button(mapsUrl, 'Open in Google Maps');
      textDetails += `\nDirections: ${mapsUrl}\n`;
    }
  }

  if (manageApplicationUrl) {
    detailsHtml += textLinkBelow(manageApplicationUrl, 'Manage this application in the dashboard');
    textDetails += `\nManage application: ${manageApplicationUrl}\n`;
  }

  detailsHtml += emailSignoff();

  const html = baseLayout(detailsHtml, { preheader });
  const text = textDetails;

  try {
    const info = await transport.sendMail({
      from: mailFrom(),
      to,
      subject,
      text,
      html,
    });
    logger.info('Employer interview scheduled email sent', { to, messageId: info.messageId });
    return { sent: true, messageId: info.messageId };
  } catch (err) {
    logger.error('Failed to send employer interview scheduled email', {
      to,
      error: err.message,
    });
    throw err;
  }
};

/**
 * Notify job seeker that their application was accepted or rejected
 * @param {Object} params
 * @param {string} [params.jobCategory]
 * @param {string} [params.jobListingStatus]
 */
export const sendApplicationDecisionEmail = async ({
  to,
  seekerName,
  seekerEmailOnFile,
  seekerPhone,
  employerName,
  employerEmail,
  employerPhone,
  companyDisplayName,
  jobTitle,
  jobCategory,
  jobListingStatus,
  outcome,
  applicationUrl,
}) => {
  const transport = getTransporter();
  if (!transport) {
    logger.warn('Email skipped: SMTP is not configured', { to, type: 'application_decision' });
    return { sent: false, skipped: true, reason: 'smtp_not_configured' };
  }

  const isAccepted = outcome === 'accepted';
  const subject = isAccepted
    ? `Great news — ${jobTitle} · Application accepted`
    : `Application update — ${jobTitle}`;
  const preheader = isAccepted
    ? `${employerName} accepted your application for ${jobTitle}.`
    : `An update on your application for ${jobTitle}.`;

  const calloutBg = isAccepted ? '#ecfdf5' : '#f8fafc';
  const calloutBorder = isAccepted ? '#6ee7b7' : '#cbd5e1';
  const calloutTitle = isAccepted ? 'Application accepted' : 'Application not moving forward';
  const calloutBody = isAccepted
    ? `<strong style="color:#065f46;">${escapeHtml(employerName)}</strong> has accepted your application for this role. They may follow up with next steps (such as onboarding or contract details) through ${escapeHtml(envConfig.smtpFromName)} or directly.`
    : `After careful review, <strong style="color:#0f172a;">${escapeHtml(employerName)}</strong> will not be proceeding with your application for this position at this time. We encourage you to keep your profile updated and explore other openings that match your skills.`;

  const innerHtml = `
    <p style="margin:0 0 14px 0;font-size:17px;color:#0f172a;font-weight:600;">Hi ${escapeHtml(seekerName)},</p>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:0 0 22px 0;background-color:${calloutBg};border-radius:12px;border:1px solid ${calloutBorder};">
      <tr>
        <td style="padding:18px 20px;">
          <p style="margin:0 0 8px;font-size:12px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#64748b;">${escapeHtml(calloutTitle)}</p>
          <p style="margin:0;font-size:15px;line-height:1.6;color:#334155;">${calloutBody}</p>
        </td>
      </tr>
    </table>
    ${jobSummaryCard({
      eyebrow: 'Related opening',
      jobTitle,
      companyDisplayName,
      jobCategory,
      jobListingStatus,
      partyLabel: 'Employer',
      partyName: employerName,
    })}
    ${profileContactPanel('Your contact (on file with this application)', seekerEmailOnFile, seekerPhone)}
    ${hiringContactPanel(employerName, employerEmail, employerPhone)}
    <p style="margin:0 0 16px 0;color:#475569;font-size:15px;line-height:1.6;">Open ${escapeHtml(envConfig.smtpFromName)} for your full application timeline, messages, and any interview history tied to this job.</p>
    ${applicationUrl ? button(applicationUrl, 'View application in dashboard') : ''}
    ${emailSignoff()}`;

  let textPlain = `Hi ${seekerName},\n\n`;
  textPlain += isAccepted
    ? `Congratulations — ${employerName} has ACCEPTED your application.\n\nPOSITION: ${jobTitle}\n`
    : `${employerName} will not be moving forward with your application at this time.\n\nPOSITION: ${jobTitle}\n`;
  if (companyDisplayName) textPlain += `Company: ${companyDisplayName}\n`;
  if (jobCategory) textPlain += `Category: ${humanizeToken(jobCategory)}\n`;
  if (jobListingStatus) textPlain += `Listing status: ${humanizeToken(jobListingStatus)}\n`;
  textPlain += `\nYOUR CONTACT\n`;
  if (seekerEmailOnFile) textPlain += `Email: ${seekerEmailOnFile}\n`;
  if (seekerPhone) textPlain += `Phone: ${seekerPhone}\n`;
  textPlain += `\nEMPLOYER CONTACT\nName: ${employerName}\n`;
  if (employerEmail) textPlain += `Email: ${employerEmail}\n`;
  if (employerPhone) textPlain += `Phone: ${employerPhone}\n`;
  const text = `${textPlain}${applicationUrl ? `\nView application: ${applicationUrl}\n` : ''}`;

  try {
    const info = await transport.sendMail({
      from: mailFrom(),
      to,
      subject,
      text,
      html: baseLayout(innerHtml, { preheader }),
    });
    logger.info('Application decision email sent', { to, outcome, messageId: info.messageId });
    return { sent: true, messageId: info.messageId };
  } catch (err) {
    logger.error('Failed to send application decision email', {
      to,
      outcome,
      error: err.message,
    });
    throw err;
  }
};

/**
 * Confirmation to employer after accept/reject (candidate is notified separately)
 * @param {string} [params.jobCategory]
 * @param {string} [params.jobListingStatus]
 */
export const sendEmployerApplicationDecisionEmail = async ({
  to,
  employerName,
  seekerName,
  seekerEmailOnFile,
  seekerPhone,
  companyDisplayName,
  jobTitle,
  jobCategory,
  jobListingStatus,
  outcome,
  employerApplicationUrl,
}) => {
  const transport = getTransporter();
  if (!transport) {
    logger.warn('Email skipped: SMTP is not configured', {
      to,
      type: 'employer_application_decision',
    });
    return { sent: false, skipped: true, reason: 'smtp_not_configured' };
  }

  const isAccepted = outcome === 'accepted';
  const subject = isAccepted
    ? `Recorded: offer / acceptance — ${seekerName} · ${jobTitle}`
    : `Recorded: application declined — ${seekerName} · ${jobTitle}`;
  const preheader = `Action saved: you ${isAccepted ? 'accepted' : 'declined'} ${seekerName} for ${jobTitle}. The candidate was emailed.`;

  const innerHtml = `
    <p style="margin:0 0 14px 0;font-size:17px;color:#0f172a;font-weight:600;">Hi ${escapeHtml(employerName)},</p>
    <p style="margin:0 0 20px 0;color:#475569;line-height:1.6;">This message confirms the decision you just saved in ${escapeHtml(envConfig.smtpFromName)}. A notification email was sent to the candidate at the address on file.</p>
    ${jobSummaryCard({
      eyebrow: 'Vacancy',
      jobTitle,
      companyDisplayName,
      jobCategory,
      jobListingStatus,
      partyLabel: 'Candidate',
      partyName: seekerName,
    })}
    ${candidateContactPanel(seekerName, seekerEmailOnFile, seekerPhone)}
    ${detailPanel(
      'Decision on file',
      detailField(
        'Outcome',
        escapeHtml(
          isAccepted
            ? 'Accepted — proceed with hiring steps as needed'
            : 'Declined — candidate has been informed'
        )
      )
    )}
    <p style="margin:0 0 16px 0;color:#475569;font-size:14px;line-height:1.55;">For compliance and team alignment, keep records of any further communication outside ${escapeHtml(envConfig.smtpFromName)} in your HR process.</p>
    ${employerApplicationUrl ? button(employerApplicationUrl, 'Open application workspace') : ''}
    ${emailSignoff()}`;

  let text = `Hi ${employerName},\n\nConfirmation: you ${isAccepted ? 'ACCEPTED' : 'DECLINED'} ${seekerName} for "${jobTitle}". The candidate was notified by email.\n`;
  if (companyDisplayName) text += `Company: ${companyDisplayName}\n`;
  if (jobCategory) text += `Category: ${humanizeToken(jobCategory)}\n`;
  if (jobListingStatus) text += `Listing status: ${humanizeToken(jobListingStatus)}\n`;
  text += `\nCandidate email: ${seekerEmailOnFile || '—'}\nCandidate phone: ${seekerPhone || '—'}\n`;
  text += employerApplicationUrl ? `\nManage application: ${employerApplicationUrl}\n` : '';

  try {
    const info = await transport.sendMail({
      from: mailFrom(),
      to,
      subject,
      text,
      html: baseLayout(innerHtml, { preheader }),
    });
    logger.info('Employer application decision email sent', {
      to,
      outcome,
      messageId: info.messageId,
    });
    return { sent: true, messageId: info.messageId };
  } catch (err) {
    logger.error('Failed to send employer application decision email', {
      to,
      outcome,
      error: err.message,
    });
    throw err;
  }
};

export const sendInterviewCancelledEmail = async ({
  to,
  seekerName,
  seekerEmailOnFile,
  seekerPhone,
  employerName,
  employerEmail,
  employerPhone,
  companyDisplayName,
  jobTitle,
  jobCategory,
  jobListingStatus,
  viewApplicationUrl,
}) => {
  const transport = getTransporter();
  if (!transport) {
    logger.warn('Email skipped: SMTP is not configured', { to, type: 'interview_cancelled' });
    return { sent: false, skipped: true, reason: 'smtp_not_configured' };
  }

  const subject = `Interview cancelled — ${jobTitle}`;
  const preheader = `Your interview for ${jobTitle} was cancelled by the employer. No action required unless they reschedule.`;

  const innerHtml = `
    <p style="margin:0 0 14px 0;font-size:17px;color:#0f172a;font-weight:600;">Hi ${escapeHtml(seekerName)},</p>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:0 0 22px 0;background-color:#fff7ed;border-radius:12px;border:1px solid #fdba74;">
      <tr>
        <td style="padding:18px 20px;">
          <p style="margin:0 0 6px;font-size:12px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#c2410c;">Interview cancelled</p>
          <p style="margin:0;font-size:15px;line-height:1.6;color:#431407;">The employer has removed the interview that was on file. You do not need to attend the previously scheduled time.</p>
        </td>
      </tr>
    </table>
    ${jobSummaryCard({
      eyebrow: 'Affected role',
      jobTitle,
      companyDisplayName,
      jobCategory,
      jobListingStatus,
      partyLabel: 'Employer',
      partyName: employerName || 'The hiring team',
    })}
    ${profileContactPanel('Your contact (on file with this application)', seekerEmailOnFile, seekerPhone)}
    ${hiringContactPanel(employerName || 'The hiring team', employerEmail, employerPhone)}
    <p style="margin:0 0 16px 0;color:#475569;font-size:15px;line-height:1.6;">If the role is still open, the employer may send a new invitation. You can also follow up through ${escapeHtml(envConfig.smtpFromName)} if messaging is enabled for this application.</p>
    ${viewApplicationUrl ? button(viewApplicationUrl, 'View application status') : ''}
    ${emailSignoff()}`;

  let text = `Hi ${seekerName},\n\nThe scheduled interview for "${jobTitle}" has been CANCELLED by the employer.\n`;
  if (companyDisplayName) text += `Company: ${companyDisplayName}\n`;
  if (employerName) text += `Employer: ${employerName}\n`;
  if (seekerEmailOnFile) text += `Your email on file: ${seekerEmailOnFile}\n`;
  if (seekerPhone) text += `Your phone on file: ${seekerPhone}\n`;
  if (employerEmail) text += `Employer email: ${employerEmail}\n`;
  if (employerPhone) text += `Employer phone: ${employerPhone}\n`;
  if (jobCategory) text += `Category: ${humanizeToken(jobCategory)}\n`;
  text += `\nCheck ${envConfig.smtpFromName} for updates or a new invite.\n`;
  text += viewApplicationUrl ? `\nApplication: ${viewApplicationUrl}\n` : '';

  try {
    const info = await transport.sendMail({
      from: mailFrom(),
      to,
      subject,
      text,
      html: baseLayout(innerHtml, { preheader }),
    });
    logger.info('Interview cancelled email sent', { to, messageId: info.messageId });
    return { sent: true, messageId: info.messageId };
  } catch (err) {
    logger.error('Failed to send interview cancelled email', {
      to,
      error: err.message,
    });
    throw err;
  }
};

/**
 * Confirmation to employer after cancelling an interview (seeker is notified separately)
 * @param {Object} params
 * @param {string} params.to - Employer email
 * @param {string} params.employerName
 * @param {string} params.seekerName
 * @param {string} params.jobTitle
 * @returns {Promise<SendResult>}
 */
export const sendEmployerInterviewCancelledEmail = async ({
  to,
  employerName,
  seekerName,
  seekerEmailOnFile,
  seekerPhone,
  companyDisplayName,
  jobTitle,
  jobCategory,
  jobListingStatus,
  manageApplicationUrl,
}) => {
  const transport = getTransporter();
  if (!transport) {
    logger.warn('Email skipped: SMTP is not configured', {
      to,
      type: 'employer_interview_cancelled',
    });
    return { sent: false, skipped: true, reason: 'smtp_not_configured' };
  }

  const subject = `Confirmation: interview removed — ${jobTitle}`;
  const preheader = `Cancellation recorded for ${seekerName}. They were notified about ${jobTitle}.`;

  const innerHtml = `
    <p style="margin:0 0 14px 0;font-size:17px;color:#0f172a;font-weight:600;">Hi ${escapeHtml(employerName)},</p>
    <p style="margin:0 0 22px 0;color:#475569;line-height:1.6;">Your cancellation is saved. We sent an email to the candidate so they are not expecting the previous interview slot.</p>
    ${jobSummaryCard({
      eyebrow: 'Role',
      jobTitle,
      companyDisplayName,
      jobCategory,
      jobListingStatus,
      partyLabel: 'Candidate',
      partyName: seekerName,
    })}
    ${candidateContactPanel(seekerName, seekerEmailOnFile, seekerPhone)}
    ${detailPanel(
      'What happens next',
      `<p style="margin:0;font-size:15px;line-height:1.6;color:#334155;">You can schedule a new time from the application workspace when ready. The prior video room link (if any) is no longer valid.</p>`
    )}
    ${manageApplicationUrl ? button(manageApplicationUrl, 'Return to application') : ''}
    ${emailSignoff()}`;

  let text = `Hi ${employerName},\n\nYou cancelled the interview with ${seekerName} for "${jobTitle}". The candidate was notified.\n`;
  if (companyDisplayName) text += `Company: ${companyDisplayName}\n`;
  if (jobCategory) text += `Category: ${humanizeToken(jobCategory)}\n`;
  text += `\nCandidate email: ${seekerEmailOnFile || '—'}\nCandidate phone: ${seekerPhone || '—'}\n`;
  text += manageApplicationUrl ? `\nApplication: ${manageApplicationUrl}\n` : '';

  try {
    const info = await transport.sendMail({
      from: mailFrom(),
      to,
      subject,
      text,
      html: baseLayout(innerHtml, { preheader }),
    });
    logger.info('Employer interview cancelled email sent', { to, messageId: info.messageId });
    return { sent: true, messageId: info.messageId };
  } catch (err) {
    logger.error('Failed to send employer interview cancelled email', {
      to,
      error: err.message,
    });
    throw err;
  }
};

export default {
  sendInterviewScheduledEmail,
  sendEmployerInterviewScheduledEmail,
  sendInterviewCancelledEmail,
  sendEmployerInterviewCancelledEmail,
  sendApplicationDecisionEmail,
  sendEmployerApplicationDecisionEmail,
};
