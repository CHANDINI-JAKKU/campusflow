import User from '../models/User.js';
import Institution from '../models/Institution.js';
import Department from '../models/Department.js';
import Course from '../models/Course.js';
import Subject from '../models/Subject.js';
import Attendance from '../models/Attendance.js';
import AttendanceRecord from '../models/AttendanceRecord.js';
import Assignment from '../models/Assignment.js';
import AssignmentSubmission from '../models/AssignmentSubmission.js';
import Grade from '../models/Grade.js';
import JobDrive from '../models/JobDrive.js';
import JobApplication from '../models/JobApplication.js';
import PlacementOutcome from '../models/PlacementOutcome.js';
import asyncHandler from '../utils/asyncHandler.js';
import ApiResponse from '../utils/ApiResponse.js';

// GET /api/analytics/overview
export const getPlatformOverview = asyncHandler(async (req, res) => {
  const isSuperAdmin = req.user.role === 'SUPER_ADMIN';
  const filter = isSuperAdmin ? {} : { institution: req.user.institution };

  const [
    totalInstitutions,
    totalStudents,
    totalFaculty,
    totalDepartments,
    totalCourses,
    totalDrives,
    totalPlacements,
    recentStudents
  ] = await Promise.all([
    Institution.countDocuments(isSuperAdmin ? {} : { _id: req.user.institution }),
    User.countDocuments({ ...filter, role: 'STUDENT', isActive: true }),
    User.countDocuments({ ...filter, role: 'FACULTY', isActive: true }),
    Department.countDocuments(filter),
    Course.countDocuments(filter),
    JobDrive.countDocuments(filter),
    PlacementOutcome.countDocuments(filter),
    User.find({ ...filter, role: 'STUDENT' })
      .select('firstName lastName email rollNumber department createdAt')
      .populate('department', 'name')
      .sort({ createdAt: -1 })
      .limit(5)
  ]);

  // Attendance statistics
  const totalAttendanceRecords = await AttendanceRecord.countDocuments(filter);
  const presentRecords = await AttendanceRecord.countDocuments({ ...filter, status: 'PRESENT' });
  const avgAttendance = totalAttendanceRecords > 0 
    ? Math.round((presentRecords / totalAttendanceRecords) * 100) 
    : null;

  // Assignment stats
  const totalAssignments = await Assignment.countDocuments(filter);
  const totalSubmissions = await AssignmentSubmission.countDocuments(filter);
  const gradedSubmissions = await AssignmentSubmission.countDocuments({ ...filter, status: 'GRADED' });

  // Placement stats
  const placedStudents = await PlacementOutcome.countDocuments({ ...filter, status: { $in: ['OFFERED', 'ACCEPTED', 'JOINED'] } });
  const placementRate = totalStudents > 0 ? Math.round((placedStudents / totalStudents) * 100) : 0;

  // Department-wise distribution
  const departments = await Department.find(filter).select('name _id');
  const deptStats = await Promise.all(departments.map(async (dept) => {
    const studentCount = await User.countDocuments({ department: dept._id, role: 'STUDENT' });
    const facultyCount = await User.countDocuments({ department: dept._id, role: 'FACULTY' });
    return {
      name: dept.name,
      students: studentCount,
      faculty: facultyCount
    };
  }));

  res.json(new ApiResponse(200, {
    totalInstitutions,
    totalStudents,
    totalFaculty,
    totalDepartments,
    totalCourses,
    totalDrives,
    totalPlacements,
    avgAttendance,
    assignmentStats: {
      total: totalAssignments,
      submissions: totalSubmissions,
      graded: gradedSubmissions
    },
    placementStats: {
      totalDrives,
      placedStudents,
      placementRate
    },
    deptStats,
    recentStudents
  }));
});

// GET /api/analytics/department/:id
export const getDepartmentAnalytics = asyncHandler(async (req, res) => {
  const deptId = req.params.id;
  const [students, faculty, courses, subjects] = await Promise.all([
    User.countDocuments({ department: deptId, role: 'STUDENT', isActive: true }),
    User.countDocuments({ department: deptId, role: 'FACULTY', isActive: true }),
    Course.countDocuments({ department: deptId, isActive: true }),
    Subject.countDocuments({ department: deptId })
  ]);

  res.json(new ApiResponse(200, {
    students,
    faculty,
    courses,
    subjects
  }));
});
