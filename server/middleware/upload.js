import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { FILE_LIMITS } from '../config/constants.js';
import ApiError from '../utils/ApiError.js';

const uploadDir = process.env.UPLOAD_DIR || 'uploads';
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(uploadDir, req.user?._id?.toString() || 'anonymous');
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

const fileFilter = (req, file, cb) => {
  if (FILE_LIMITS.ALLOWED_MIME.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new ApiError(400, `File type ${file.mimetype} not allowed`), false);
  }
};

export const upload = multer({
  storage,
  limits: { fileSize: FILE_LIMITS.MAX_SIZE },
  fileFilter,
});

export const uploadSingle = upload.single('file');
export const uploadMultiple = upload.array('files', 5);
