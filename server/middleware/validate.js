import { validationResult } from 'express-validator';
import ApiError from '../utils/ApiError.js';

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ApiError(422, 'Validation failed', errors.array().map((e) => ({ field: e.path, message: e.msg })));
  }
  next();
};

export default validate;
