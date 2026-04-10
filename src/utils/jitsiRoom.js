import crypto from 'crypto';

export const generateJitsiRoomName = (applicationId) => {
  const idSlice = applicationId.toString().slice(-8);
  const random = crypto.randomBytes(16).toString('hex');
  return `jobloom-${idSlice}-${random}`;
};
