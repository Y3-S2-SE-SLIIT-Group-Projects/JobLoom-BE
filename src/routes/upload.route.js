import express from 'express';
import fs from 'fs';
import upload from '../middleware/uploads/fileUpload.js';
import { uploadToCloudinary } from '../services/upload.service.js';

const router = express.Router();

router.post('/', upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded' });
  }

  try {
    const folder = req.body?.folder;
    const result = await uploadToCloudinary(req.file.path, folder, req.file.mimetype);
    res.json(result);
  } finally {
    // Best-effort cleanup of local temp file
    try {
      fs.unlinkSync(req.file.path);
    } catch {
      // ignore
    }
  }
});

export default router;
