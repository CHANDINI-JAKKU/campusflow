import ApiError from '../utils/ApiError.js';

// Role-based access control middleware
export const authorize = (...roles) => (req, res, next) => {
  if (!req.user) throw new ApiError(401, 'Authentication required');
  if (!roles.includes(req.user.role)) {
    throw new ApiError(403, `Access denied. Required roles: ${roles.join(', ')}`);
  }
  next();
};

// Ensure user belongs to the institution they're accessing
export const verifyInstitutionAccess = (req, res, next) => {
  if (!req.user) return next(new ApiError(401, 'Authentication required'));
  if (req.user.role === 'SUPER_ADMIN') return next(); // Super admin can access all

  const requestedInstitution =
    req.params.institutionId ||
    req.body.institution ||
    req.query.institutionId;

  if (requestedInstitution && requestedInstitution !== req.user.institution?.toString()) {
    return next(new ApiError(403, 'Access denied to this institution'));
  }
  next();
};

// Enforce institution scoping on DB queries
export const scopeToInstitution = (req, res, next) => {
  if (req.user.role !== 'SUPER_ADMIN') {
    req.institutionId = req.user.institution;
  }
  next();
};
