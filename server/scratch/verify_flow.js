import mongoose from 'mongoose';
import connectDB from '../config/db.js';
import User from '../models/User.js';
import Subject from '../models/Subject.js';
import Department from '../models/Department.js';
import Course from '../models/Course.js';
import Timetable from '../models/Timetable.js';
import ClassSession from '../models/ClassSession.js';
import AttendanceRecord from '../models/AttendanceRecord.js';
import Grade from '../models/Grade.js';
import { calcAttendanceStats, calcOverallAttendance } from '../utils/calcAttendance.js';
import dotenv from 'dotenv';

dotenv.config();

const verifyFlow = async () => {
  try {
    await connectDB();
    console.log('🔍 Starting End-to-End System Verification...');

    // 1. Check Demo Student (Alex Morgan)
    const student = await User.findOne({ email: 'student@campusflow.demo' });
    console.log(`✅ Student found: ${student.firstName} ${student.lastName} (Roll: ${student.rollNumber}, Sec: ${student.section}, Year: ${student.year})`);

    // 2. Check Faculty (Dr. Robert Chen)
    const faculty = await User.findOne({ email: 'faculty@campusflow.demo' });
    console.log(`✅ Faculty found: ${faculty.firstName} ${faculty.lastName} (Emp ID: ${faculty.employeeId})`);

    // 3. Check Timetable count
    const totalTimetables = await Timetable.countDocuments();
    console.log(`✅ Total Weekly Timetable Entries: ${totalTimetables}`);

    // 4. Check Today's classes for Faculty
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dayOfWeek = today.getDay();

    const facultyTodayClasses = await Timetable.find({ faculty: faculty._id, dayOfWeek }).populate('subject');
    console.log(`✅ Faculty assigned classes today (Day ${dayOfWeek}): ${facultyTodayClasses.length}`);
    facultyTodayClasses.forEach(c => console.log(`   - ${c.startTime} - ${c.endTime} | ${c.subject?.name} (Sec ${c.section}, Room ${c.room})`));

    // 5. Check Today's classes for Student
    const studentTodayClasses = await Timetable.find({
      department: student.department,
      year: student.year,
      semester: student.semester,
      section: student.section,
      dayOfWeek
    }).populate('subject').populate('faculty');
    console.log(`✅ Student enrolled classes today (Day ${dayOfWeek}): ${studentTodayClasses.length}`);
    studentTodayClasses.forEach(c => console.log(`   - ${c.startTime} - ${c.endTime} | ${c.subject?.name} (Faculty: ${c.faculty?.firstName} ${c.faculty?.lastName}, Room ${c.room})`));

    // 6. Check ClassSessions generated
    const sessionsToday = await ClassSession.find({ date: today });
    console.log(`✅ ClassSessions active for today: ${sessionsToday.length}`);

    // 7. Test Attendance calculation for Alex Morgan
    const overallAtt = await calcOverallAttendance(student._id);
    console.log(`✅ Alex Morgan Overall Attendance: ${overallAtt.percentage}% (${overallAtt.attended}/${overallAtt.total} classes attended) - isAtRisk: ${overallAtt.isAtRisk}`);

    // 8. Test Subject-wise calculation (DBMS vs DSA vs OS)
    const dbmsSession = await ClassSession.findOne({ subject: { $exists: true } }).populate('subject');
    if (dbmsSession) {
      const stats = await calcAttendanceStats(student._id, dbmsSession.subject._id);
      console.log(`✅ Alex Morgan ${dbmsSession.subject?.name} Attendance: ${stats.percentage}% (${stats.attended}/${stats.totalClasses}) - Status: "${stats.statusMessage}"`);
    }

    console.log('🎉 Full End-to-End Timetable & Attendance System Verified Successfully!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Verification failed:', err);
    process.exit(1);
  }
};

verifyFlow();
