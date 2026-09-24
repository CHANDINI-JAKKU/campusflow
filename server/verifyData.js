import mongoose from 'mongoose';
import dotenv from 'dotenv';
import connectDB from './config/db.js';
import User from './models/User.js';
import Enrollment from './models/Enrollment.js';
import Subject from './models/Subject.js';
import Timetable from './models/Timetable.js';
import AttendanceRecord from './models/AttendanceRecord.js';
import Attendance from './models/Attendance.js';
import Assignment from './models/Assignment.js';
import Grade from './models/Grade.js';
import AcademicCalendarEvent from './models/AcademicCalendarEvent.js';

dotenv.config();

const countOrphans = async (Model, localField, ForeignModel) => {
  const ids = await ForeignModel.distinct('_id');
  return Model.countDocuments({ [localField]: { $nin: ids } });
};

const run = async () => {
  await connectDB();
  const checks = [];
  const studentsWithoutInstitution = await User.countDocuments({ role: 'STUDENT', $or: [{ institution: { $exists: false } }, { institution: null }] });
  const studentsWithoutDepartment = await User.countDocuments({ role: 'STUDENT', $or: [{ department: { $exists: false } }, { department: null }] });
  checks.push(['students have institutions', studentsWithoutInstitution === 0, studentsWithoutInstitution]);
  checks.push(['students have departments', studentsWithoutDepartment === 0, studentsWithoutDepartment]);
  checks.push(['enrollments reference students', await countOrphans(Enrollment, 'student', User) === 0]);
  const facultyIds = await User.distinct('_id', { role: 'FACULTY' });
  const subjectsWithInvalidFaculty = await Subject.countDocuments({ faculty: { $exists: true, $ne: null, $nin: facultyIds } });
  checks.push(['subjects reference faculty when assigned', subjectsWithInvalidFaculty === 0, subjectsWithInvalidFaculty]);
  checks.push(['timetable subjects exist', await countOrphans(Timetable, 'subject', Subject) === 0]);
  checks.push(['attendance references sessions', await countOrphans(AttendanceRecord, 'attendance', Attendance) === 0]);
  checks.push(['assignments reference subjects', await countOrphans(Assignment, 'subject', Subject) === 0]);
  checks.push(['grades reference students', await countOrphans(Grade, 'student', User) === 0]);
  const invalidCalendarDates = await AcademicCalendarEvent.countDocuments({ $expr: { $gt: ['$startDate', '$endDate'] } });
  checks.push(['calendar dates are ordered', invalidCalendarDates === 0, invalidCalendarDates]);

  const failed = checks.filter(([, ok]) => !ok);
  checks.forEach(([label, ok, count]) => console.log(`${ok ? 'PASS' : 'FAIL'} ${label}${count === undefined ? '' : ` (${count})`}`));
  await mongoose.disconnect();
  if (failed.length) process.exitCode = 1;
};

run().catch(async (error) => {
  console.error(`verify-data failed: ${error.message}`);
  await mongoose.disconnect();
  process.exitCode = 1;
});
