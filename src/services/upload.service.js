import cloudinary from '../config/cloudinary.js';

export const uploadToCloudinary = async (filePath, folder, fileType) => {
  const options = { folder: folder || 'jobloom_uploads' };

  // Cloudinary defaults to `resource_type=image`, which fails for PDFs/DOCs.
  // Use `auto` for anything that's not a typical image.
  const isImage = typeof fileType === 'string' && fileType.startsWith('image/');
  if (!isImage) {
    options.resource_type = 'auto';
  }

  const result = await cloudinary.uploader.upload(filePath, options);

  return {
    url: result.secure_url,
    public_id: result.public_id,
    resource_type: result.resource_type,
  };
};

// (optional) keep old name so your /upload route still works without changes
export const uploadFileToCloudinary = async (filePath, fileType) => {
  return uploadToCloudinary(filePath, 'jobloom_uploads', fileType);
};
