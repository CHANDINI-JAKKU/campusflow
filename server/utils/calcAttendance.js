import { ATTENDANCE_THRESHOLD } from '../config/constants.js';
import AttendanceRecord from '../models/AttendanceRecord.js';
import ClassSession from '../models/ClassSession.js';
import Attendance from '../models/Attendance.js';

/**
 * Calculate attendance stats for a student in a specific subject
 */
export const calcAttendanceStats = async (studentId, subjectId) => {
  // Count records for this student and subject
  const records = await AttendanceRecord.find({
    student: studentId,
    subject: subjectId
  });

  const totalClasses = records.length;
  if (totalClasses === 0) {
    return {
      totalClasses: 0,
      attended: 0,
      percentage: null, // null indicates no records yet
      classesNeeded: 0,
      isAtRisk: false,
      hasRecords: false,
      statusMessage: 'No attendance recorded yet'
    };
  }

  const attended = records.filter(r => r.status === 'PRESENT' || r.status === 'LATE').length;
  const percentage = Math.round((attended / totalClasses) * 100);
  const isAtRisk = percentage < ATTENDANCE_THRESHOLD;

  // How many consecutive classes needed to reach threshold (e.g. 75%)?
  // (attended + x) / (totalClasses + x) >= 0.75
  // attended + x >= 0.75 * totalClasses + 0.75 * x
  // 0.25 * x >= 0.75 * totalClasses - attended
  // x >= (0.75 * totalClasses - attended) / 0.25
  let classesNeeded = 0;
  if (isAtRisk) {
    const thresholdFraction = ATTENDANCE_THRESHOLD / 100;
    const numerator = (thresholdFraction * totalClasses) - attended;
    const denominator = 1 - thresholdFraction;
    classesNeeded = Math.max(1, Math.ceil(numerator / denominator));
  }

  return {
    totalClasses,
    attended,
    absent: totalClasses - attended,
    percentage,
    classesNeeded,
    isAtRisk,
    hasRecords: true,
    statusMessage: isAtRisk
      ? `Attendance below ${ATTENDANCE_THRESHOLD}% - You need to attend the next ${classesNeeded} classes to reach ${ATTENDANCE_THRESHOLD}%`
      : `Attendance requirement satisfied (${percentage}%)`
  };
};

/**
 * Calculate overall attendance across all subjects for a student
 */
export const calcOverallAttendance = async (studentId) => {
  const records = await AttendanceRecord.find({ student: studentId });
  const total = records.length;
  if (total === 0) {
    return {
      total: 0,
      attended: 0,
      absent: 0,
      percentage: null,
      hasRecords: false,
      isAtRisk: false,
      statusMessage: 'No attendance recorded yet'
    };
  }

  const attended = records.filter(r => r.status === 'PRESENT' || r.status === 'LATE').length;
  const percentage = Math.round((attended / total) * 100);
  const isAtRisk = percentage < ATTENDANCE_THRESHOLD;

  return {
    total,
    attended,
    absent: total - attended,
    percentage,
    hasRecords: true,
    isAtRisk,
    statusMessage: isAtRisk
      ? `Overall attendance (${percentage}%) is below the ${ATTENDANCE_THRESHOLD}% requirement`
      : `Overall attendance requirement satisfied (${percentage}%)`
  };
};
