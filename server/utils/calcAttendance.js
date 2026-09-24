import { ATTENDANCE_THRESHOLD } from '../config/constants.js';
import AttendanceRecord from '../models/AttendanceRecord.js';
import Attendance from '../models/Attendance.js';

/**
 * Calculate attendance stats for a student in a subject
 */
export const calcAttendanceStats = async (studentId, subjectId) => {
  // Get all attendance sessions for this subject
  const sessions = await Attendance.find({ subject: subjectId });
  const sessionIds = sessions.map((s) => s._id);

  const total = sessionIds.length;
  if (total === 0) return { totalClasses: 0, attended: 0, percentage: 0, classesNeeded: 0, isAtRisk: false };

  const attended = await AttendanceRecord.countDocuments({
    attendance: { $in: sessionIds },
    student: studentId,
    status: 'PRESENT',
  });

  const percentage = Math.round((attended / total) * 100);
  const isAtRisk = percentage < ATTENDANCE_THRESHOLD;

  // How many consecutive classes needed to reach 75%?
  let classesNeeded = 0;
  if (isAtRisk) {
    // (attended + x) / (total + x) >= 0.75
    // attended + x >= 0.75 * total + 0.75 * x
    // 0.25 * x >= 0.75 * total - attended
    classesNeeded = Math.ceil((0.75 * total - attended) / 0.25);
  }

  return { totalClasses: total, attended, percentage, classesNeeded, isAtRisk };
};

/**
 * Calculate overall attendance across all subjects for a student
 */
export const calcOverallAttendance = async (studentId, institutionId) => {
  const records = await AttendanceRecord.find({ student: studentId })
    .populate({ path: 'attendance', match: {} });

  const validRecords = records.filter((r) => r.attendance);
  const total = validRecords.length;
  const attended = validRecords.filter((r) => r.status === 'PRESENT').length;
  const percentage = total > 0 ? Math.round((attended / total) * 100) : 0;

  return { total, attended, percentage };
};
