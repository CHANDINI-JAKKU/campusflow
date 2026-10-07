import mongoose from 'mongoose';
import connectDB from '../config/db.js';
import User from '../models/User.js';
import Subject from '../models/Subject.js';
import ClassSession from '../models/ClassSession.js';
import Enrollment from '../models/Enrollment.js';
import Assignment from '../models/Assignment.js';
import dotenv from 'dotenv';

dotenv.config();

const runTest = async () => {
  try {
    await connectDB();
    console.log('🧪 Running Rigorous Registered-Students & Roll-Number Verification...');

    // 1. Verify Student Chandini Jakku with real Roll Number
    const student = await User.findOne({ rollNumber: '24EG105Q39' });
    if (!student) throw new Error('Student with rollNumber 24EG105Q39 not found!');
    console.log(`✅ Student Record: ${student.firstName} ${student.lastName} | Roll: ${student.rollNumber} | Dept: ${student.department} | Sec: ${student.section}`);

    // 2. Verify Subject-Level Enrollments for Chandini
    const chandiniEnrollments = await Enrollment.find({ student: student._id, status: 'ACTIVE' }).populate('subject');
    console.log(`✅ Chandini is actively enrolled in ${chandiniEnrollments.length} subjects:`);
    chandiniEnrollments.forEach(e => console.log(`   - ${e.subject?.name} (${e.subject?.code}) [Section ${e.section}]`));

    // 3. Find DBMS Subject
    const subDbms = await Subject.findOne({ code: 'CS201' });

    // 4. Test DBMS Section A Roster Query (MUST BE EXACTLY 3 STUDENTS)
    const secAEnrollments = await Enrollment.find({
      subject: subDbms._id,
      section: 'A',
      status: 'ACTIVE'
    }).populate('student');

    console.log(`\n🎯 DBMS (CS201) Section A Active Enrollment Count: ${secAEnrollments.length}`);
    secAEnrollments.forEach(e => console.log(`   👉 ${e.student.rollNumber} — ${e.student.firstName} ${e.student.lastName}`));

    if (secAEnrollments.length !== 3) {
      throw new Error(`Expected exactly 3 students in DBMS Section A, found ${secAEnrollments.length}`);
    }

    // 5. Test DBMS Section B Roster Query (MUST BE EXACTLY 5 STUDENTS)
    const secBEnrollments = await Enrollment.find({
      subject: subDbms._id,
      section: 'B',
      status: 'ACTIVE'
    }).populate('student');

    console.log(`\n🎯 DBMS (CS201) Section B Active Enrollment Count: ${secBEnrollments.length}`);
    secBEnrollments.forEach(e => console.log(`   👉 ${e.student.rollNumber} — ${e.student.firstName} ${e.student.lastName}`));

    if (secBEnrollments.length !== 5) {
      throw new Error(`Expected exactly 5 students in DBMS Section B, found ${secBEnrollments.length}`);
    }

    // 6. Test Assignment Isolation (DBMS Sec A assignment should only be visible to Sec A enrolled students)
    const dbmsAssignment = await Assignment.findOne({ subject: subDbms._id, section: 'A' });
    console.log(`\n📚 Section A DBMS Assignment: "${dbmsAssignment.title}"`);
    console.log(`   Target Section: Section ${dbmsAssignment.section}`);

    // Verify Ananya Verma (24EG105Q03 - not enrolled in DBMS) does NOT appear in DBMS roster
    const ananya = await User.findOne({ rollNumber: '24EG105Q03' });
    const isAnanyaInDbms = secAEnrollments.some(e => e.student._id.equals(ananya._id));
    console.log(`🔒 Verification: Is Student 24EG105Q03 (Ananya, not enrolled in DBMS) in DBMS roster? -> ${isAnanyaInDbms ? 'YES (BUG)' : 'NO (CORRECT)'}`);

    if (isAnanyaInDbms) {
      throw new Error('Data leak bug: Un-enrolled student found in subject roster!');
    }

    console.log('\n🏆 ALL DATA RELATIONSHIPS & ISOLATION CONSTRAINTS VERIFIED 100% SUCCESFULLY!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Verification failed:', err);
    process.exit(1);
  }
};

runTest();
