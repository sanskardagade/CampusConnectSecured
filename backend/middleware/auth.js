const jwt = require('jsonwebtoken');

const authenticateToken = (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ 
        success: false,
        message: 'No token provided' 
      });
    }

    jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret', (err, decoded) => {
      if (err) {
        console.error('Token verification error:', err);
        return res.status(403).json({ 
          success: false,
          message: 'Invalid or expired token' 
        });
      }

      // Set basic user info
      req.user = {
        id: decoded.id,
        role: decoded.role,
        erpid: decoded.erpid || decoded.erpStaffId // Handle both student and faculty/staff IDs
      };

      // Add role-specific fields
      switch (decoded.role) {
        case 'admin':
          // Admin needs only a valid id in token
          if (!decoded.id) {
            console.error('Admin token missing required data:', decoded);
            return res.status(403).json({ 
              success: false,
              message: 'Invalid Admin token data' 
            });
          }
          break;
        case 'hod':
          if (!decoded.erpStaffId || !decoded.departmentId) {
            console.error('HOD token missing required data:', decoded);
            return res.status(403).json({ 
              success: false,
              message: 'Invalid HOD token data' 
            });
          }
          req.user.erpStaffId = decoded.erpStaffId;
          req.user.departmentId = decoded.departmentId;
          break;
          
        case 'principal':
        case 'registrar':
          if (!decoded.id) {
            console.error(`${decoded.role} token missing required data:`, decoded);
            return res.status(403).json({ 
              success: false,
              message: `Invalid ${decoded.role} token data` 
            });
          }
          break;
          
        case 'faculty':
          if (!decoded.erpStaffId) {
            console.error('Faculty token missing required data:', decoded);
            return res.status(403).json({ 
              success: false,
              message: 'Invalid Faculty token data' 
            });
          }
          req.user.erpStaffId = decoded.erpStaffId;
          break;
          
        case 'student':
          if (!decoded.erpid) {
            console.error('Student token missing required data:', decoded);
            return res.status(403).json({ 
              success: false,
              message: 'Invalid Student token data' 
            });
          }
          req.user.erpid = decoded.erpid;
          break;
          
        default:
          return res.status(403).json({ 
            success: false,
            message: 'Invalid user role' 
          });
      }
      
      next();
    });
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Authentication error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Role verification middlewares
const createRoleVerifier = (role) => {
  return (req, res, next) => {
    if (req.user?.role !== role) {
      return res.status(403).json({ 
        success: false,
        message: `Access denied. ${role} role required` 
      });
    }
    next();
  };
};

// Create all role verifiers from a single factory function
const verifyPrincipal = createRoleVerifier('principal');
const verifyAdmin = createRoleVerifier('admin');
const verifyRegistrar = createRoleVerifier('registrar');
const verifyHOD = createRoleVerifier('hod');
const verifyFaculty = createRoleVerifier('faculty');
const verifyStudent = createRoleVerifier('student');

module.exports = {
  authenticateToken,
  verifyPrincipal,
  verifyAdmin,
  verifyRegistrar,
  verifyHOD,
  verifyFaculty,
  verifyStudent
};