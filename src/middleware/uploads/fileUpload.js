import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Absolute path to the uploads root (project root/uploads)
const UPLOADS_ROOT = path.join(__dirname, '../../../uploads');

const storage = multer.diskStorage({
  destination(req, file, cb) {
    let subDir;

    if (file.fieldname === 'cv') {
      subDir = 'cvs';
    } else if (file.fieldname === 'profileImage') {
      subDir = 'profiles';
    } else {
      subDir = 'others';
    }

    const uploadPath = path.join(UPLOADS_ROOT, subDir);

    // Ensure directory exists
    fs.mkdirSync(uploadPath, { recursive: true });

    cb(null, uploadPath);
  },
  filename(req, file, cb) {
    cb(null, `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`);
  },
});

function checkFileType(file, cb) {
  const filetypes = /jpg|jpeg|png|pdf|doc|docx/;
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = filetypes.test(file.mimetype);

  if (extname && mimetype) {
    return cb(null, true);
  } else {
    cb(new Error('Images and Documents only!'));
  }
}

const upload = multer({
  storage,
  limits: { fileSize: 5000000 }, // 5MB limit
  fileFilter: function (req, file, cb) {
    checkFileType(file, cb);
  },
});

export default upload;
