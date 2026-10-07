import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import connectDB from '../config/db.js';
import User from '../models/User.js';
import Institution from '../models/Institution.js';
import Department from '../models/Department.js';
import Course from '../models/Course.js';
import Subject from '../models/Subject.js';
import Timetable from '../models/Timetable.js';
import ClassSession from '../models/ClassSession.js';
import AttendanceRecord from '../models/AttendanceRecord.js';
import Enrollment from '../models/Enrollment.js';
import Assignment from '../models/Assignment.js';
import AssignmentSubmission from '../models/AssignmentSubmission.js';
import Grade from '../models/Grade.js';
import AcademicRecord from '../models/AcademicRecord.js';
import Company from '../models/Company.js';
import JobDrive from '../models/JobDrive.js';
import JobApplication from '../models/JobApplication.js';
import Notification from '../models/Notification.js';
import dotenv from 'dotenv';

dotenv.config();

const runSeeder = async () => {
  try {
    await connectDB();
    console.log('🧹 Clearing existing database collections...');
    await mongoose.connection.dropDatabase();

    const hashedPwd = await bcrypt.hash('Demo@1234', 12);

    // ==========================================
    // 1. SUPER ADMIN & INSTITUTIONS
    // ==========================================
    const superAdmin = await User.create({
      firstName: 'Super',
      lastName: 'Administrator',
      email: 'superadmin@campusflow.demo',
      password: hashedPwd,
      role: 'SUPER_ADMIN',
      phone: '+91 98765 00001',
      isActive: true,
      isEmailVerified: true
    });

    const inst1 = await Institution.create({
      name: 'Sunrise University of Technology',
      code: 'SUN01',
      address: '742 Academic Hills, Knowledge Corridor, Hyderabad',
      phone: '+91 40 2345 6789',
      email: 'contact@sunrise.edu.in',
      website: 'https://sunrise.campusflow.demo',
      type: 'UNIVERSITY',
      establishedYear: 1985,
      isActive: true,
      adminUser: superAdmin._id
    });

    // ==========================================
    // 2. COLLEGE ADMIN
    // ==========================================
    const admin1 = await User.create({
      firstName: 'Eleanor',
      lastName: 'Vance',
      email: 'admin@campusflow.demo',
      password: hashedPwd,
      role: 'COLLEGE_ADMIN',
      institution: inst1._id,
      phone: '+91 98765 01001',
      isActive: true,
      isEmailVerified: true
    });

    // ==========================================
    // 3. DEPARTMENTS
    // ==========================================
    const cseDept = await Department.create({
      name: 'Computer Science & Engineering',
      code: 'CSE',
      institution: inst1._id,
      description: 'Department of Computer Science & Software Engineering',
      isActive: true
    });

    const eceDept = await Department.create({
      name: 'Electronics & Communication',
      code: 'ECE',
      institution: inst1._id,
      description: 'Department of Microelectronics, VLSI & Communications',
      isActive: true
    });

    const eeeDept = await Department.create({
      name: 'Electrical & Electronics',
      code: 'EEE',
      institution: inst1._id,
      description: 'Department of Power Systems & Electrical Machines',
      isActive: true
    });

    const mechDept = await Department.create({
      name: 'Mechanical Engineering',
      code: 'MECH',
      institution: inst1._id,
      description: 'Department of Robotics & Thermal Engineering',
      isActive: true
    });

    // ==========================================
    // 4. FACULTY MEMBERS ACROSS DEPARTMENTS
    // ==========================================
    // CSE Faculty
    const faculty1 = await User.create({
      firstName: 'Dr. Robert',
      lastName: 'Chen',
      email: 'faculty@campusflow.demo',
      password: hashedPwd,
      role: 'FACULTY',
      institution: inst1._id,
      department: cseDept._id,
      employeeId: 'FAC-CSE-001',
      phone: '+91 98765 02001',
      skills: ['Database Systems', 'Distributed Computing', 'SQL'],
      isActive: true
    });

    const faculty2 = await User.create({
      firstName: 'Dr. Sarah',
      lastName: 'Jenkins',
      email: 'sarah.jenkins@campusflow.demo',
      password: hashedPwd,
      role: 'FACULTY',
      institution: inst1._id,
      department: cseDept._id,
      employeeId: 'FAC-CSE-002',
      skills: ['Data Structures', 'Algorithms', 'C++'],
      isActive: true
    });

    const faculty3 = await User.create({
      firstName: 'Prof. David',
      lastName: 'Miller',
      email: 'david.miller@campusflow.demo',
      password: hashedPwd,
      role: 'FACULTY',
      institution: inst1._id,
      department: cseDept._id,
      employeeId: 'FAC-CSE-003',
      skills: ['Operating Systems', 'Computer Networks', 'Linux'],
      isActive: true
    });

    // ECE Faculty
    const facultyEce = await User.create({
      firstName: 'Dr. Ananya',
      lastName: 'Sharma',
      email: 'ananya.sharma@campusflow.demo',
      password: hashedPwd,
      role: 'FACULTY',
      institution: inst1._id,
      department: eceDept._id,
      employeeId: 'FAC-ECE-001',
      skills: ['Digital Electronics', 'Microprocessors'],
      isActive: true
    });

    // Placement Officer
    const placementOfficer = await User.create({
      firstName: 'Samantha',
      lastName: 'Reed',
      email: 'placement@campusflow.demo',
      password: hashedPwd,
      role: 'PLACEMENT_OFFICER',
      institution: inst1._id,
      employeeId: 'TPO-001',
      phone: '+91 98765 03001',
      isActive: true
    });

    // ==========================================
    // 5. COURSES & SUBJECTS
    // ==========================================
    const btechCse = await Course.create({
      name: 'B.Tech Computer Science and Engineering',
      code: 'BTECH-CSE',
      department: cseDept._id,
      institution: inst1._id,
      semester: 1,
      year: 2,
      credits: 24,
      isActive: true
    });

    const btechEce = await Course.create({
      name: 'B.Tech Electronics and Communication',
      code: 'BTECH-ECE',
      department: eceDept._id,
      institution: inst1._id,
      semester: 1,
      year: 2,
      credits: 24,
      isActive: true
    });

    // CSE Subjects (Year 2, Semester 1)
    const subDbms = await Subject.create({
      name: 'Database Management Systems',
      code: 'CS201',
      course: btechCse._id,
      department: cseDept._id,
      institution: inst1._id,
      faculty: faculty1._id,
      credits: 4,
      maxInternalMarks: 30,
      maxExternalMarks: 70
    });

    const subDs = await Subject.create({
      name: 'Data Structures and Algorithms',
      code: 'CS202',
      course: btechCse._id,
      department: cseDept._id,
      institution: inst1._id,
      faculty: faculty2._id,
      credits: 4,
      maxInternalMarks: 30,
      maxExternalMarks: 70
    });

    const subOs = await Subject.create({
      name: 'Operating Systems',
      code: 'CS203',
      course: btechCse._id,
      department: cseDept._id,
      institution: inst1._id,
      faculty: faculty3._id,
      credits: 4,
      maxInternalMarks: 30,
      maxExternalMarks: 70
    });

    const subCn = await Subject.create({
      name: 'Computer Networks',
      code: 'CS204',
      course: btechCse._id,
      department: cseDept._id,
      institution: inst1._id,
      faculty: faculty3._id,
      credits: 3,
      maxInternalMarks: 30,
      maxExternalMarks: 70
    });

    // ECE Subject
    const subDe = await Subject.create({
      name: 'Digital Electronics',
      code: 'EC201',
      course: btechEce._id,
      department: eceDept._id,
      institution: inst1._id,
      faculty: facultyEce._id,
      credits: 4,
      maxInternalMarks: 30,
      maxExternalMarks: 70
    });

    // ==========================================
    // 6. REAL STUDENT RECORDS (REAL ROLL NUMBERS)
    // ==========================================
    console.log('Creating real student records with verified university roll numbers...');

    // Primary Student: Chandini Jakku (Roll: 24EG105Q39)
    const studentChandini = await User.create({
      firstName: 'Chandini',
      lastName: 'Jakku',
      email: 'student@campusflow.demo',
      password: hashedPwd,
      role: 'STUDENT',
      institution: inst1._id,
      department: cseDept._id,
      rollNumber: '24EG105Q39',
      year: 2,
      semester: 1,
      section: 'A',
      phone: '+91 98765 43210',
      profileCompletion: 90,
      skills: ['React', 'JavaScript', 'Node.js', 'Python', 'SQL', 'MongoDB'],
      isActive: true,
      isEmailVerified: true
    });

    // Student 2 in CSE Sec A: Rahul Sharma (Roll: 24EG105Q01)
    const studentRahul = await User.create({
      firstName: 'Rahul',
      lastName: 'Sharma',
      email: 'rahul.sharma@campusflow.demo',
      password: hashedPwd,
      role: 'STUDENT',
      institution: inst1._id,
      department: cseDept._id,
      rollNumber: '24EG105Q01',
      year: 2,
      semester: 1,
      section: 'A',
      phone: '+91 98765 11001',
      isActive: true,
      isEmailVerified: true
    });

    // Student 3 in CSE Sec A: Priya Patel (Roll: 24EG105Q02)
    const studentPriya = await User.create({
      firstName: 'Priya',
      lastName: 'Patel',
      email: 'priya.patel@campusflow.demo',
      password: hashedPwd,
      role: 'STUDENT',
      institution: inst1._id,
      department: cseDept._id,
      rollNumber: '24EG105Q02',
      year: 2,
      semester: 1,
      section: 'A',
      phone: '+91 98765 11002',
      isActive: true,
      isEmailVerified: true
    });

    // Student 4 in CSE Sec A: Ananya Verma (Roll: 24EG105Q03 - Enrolled in OS & DSA only, NOT in DBMS)
    const studentAnanya = await User.create({
      firstName: 'Ananya',
      lastName: 'Verma',
      email: 'ananya.verma@campusflow.demo',
      password: hashedPwd,
      role: 'STUDENT',
      institution: inst1._id,
      department: cseDept._id,
      rollNumber: '24EG105Q03',
      year: 2,
      semester: 1,
      section: 'A',
      phone: '+91 98765 11003',
      isActive: true,
      isEmailVerified: true
    });

    // CSE Section B Students (5 students: 24EG105Q51 - 24EG105Q55)
    const cseBStudents = [];
    const secBNames = [
      ['Aditya', 'Rao'], ['Sneha', 'Reddy'], ['Vikram', 'Mehta'], ['Pooja', 'Nair'], ['Karan', 'Kapoor']
    ];
    for (let i = 0; i < secBNames.length; i++) {
      const st = await User.create({
        firstName: secBNames[i][0],
        lastName: secBNames[i][1],
        email: `${secBNames[i][0].toLowerCase()}.${secBNames[i][1].toLowerCase()}@campusflow.demo`,
        password: hashedPwd,
        role: 'STUDENT',
        institution: inst1._id,
        department: cseDept._id,
        rollNumber: `24EG105Q${51 + i}`,
        year: 2,
        semester: 1,
        section: 'B',
        isActive: true,
        isEmailVerified: true
      });
      cseBStudents.push(st);
    }

    // ECE Section A Students (4 students: 24EG104Q01 - 24EG104Q04)
    const eceStudents = [];
    const eceNames = [
      ['Rohan', 'Gupta'], ['Meera', 'Iyer'], ['Siddharth', 'Joshi'], ['Divya', 'Menon']
    ];
    for (let i = 0; i < eceNames.length; i++) {
      const st = await User.create({
        firstName: eceNames[i][0],
        lastName: eceNames[i][1],
        email: `${eceNames[i][0].toLowerCase()}.${eceNames[i][1].toLowerCase()}@campusflow.demo`,
        password: hashedPwd,
        role: 'STUDENT',
        institution: inst1._id,
        department: eceDept._id,
        rollNumber: `24EG104Q${(i + 1).toString().padStart(2, '0')}`,
        year: 2,
        semester: 1,
        section: 'A',
        isActive: true,
        isEmailVerified: true
      });
      eceStudents.push(st);
    }

    // ==========================================
    // 7. EXPLICIT SUBJECT-LEVEL ENROLLMENTS
    // ==========================================
    console.log('Enrolling students explicitly into subject cohorts...');

    // A) CSE Section A — DBMS (CS201): EXACTLY 3 STUDENTS (Chandini, Rahul, Priya)
    const dbmsSecAStudents = [studentChandini, studentRahul, studentPriya];
    for (const st of dbmsSecAStudents) {
      await Enrollment.create({
        student: st._id,
        institution: inst1._id,
        department: cseDept._id,
        course: btechCse._id,
        year: 2,
        semester: 1,
        section: 'A',
        subject: subDbms._id,
        academicYear: '2026-2027',
        status: 'ACTIVE',
        isActive: true
      });
    }

    // B) CSE Section A — DSA (CS202): EXACTLY 3 STUDENTS (Chandini, Rahul, Ananya)
    const dsaSecAStudents = [studentChandini, studentRahul, studentAnanya];
    for (const st of dsaSecAStudents) {
      await Enrollment.create({
        student: st._id,
        institution: inst1._id,
        department: cseDept._id,
        course: btechCse._id,
        year: 2,
        semester: 1,
        section: 'A',
        subject: subDs._id,
        academicYear: '2026-2027',
        status: 'ACTIVE',
        isActive: true
      });
    }

    // C) CSE Section A — OS (CS203): EXACTLY 4 STUDENTS (Chandini, Rahul, Priya, Ananya)
    const osSecAStudents = [studentChandini, studentRahul, studentPriya, studentAnanya];
    for (const st of osSecAStudents) {
      await Enrollment.create({
        student: st._id,
        institution: inst1._id,
        department: cseDept._id,
        course: btechCse._id,
        year: 2,
        semester: 1,
        section: 'A',
        subject: subOs._id,
        academicYear: '2026-2027',
        status: 'ACTIVE',
        isActive: true
      });
    }

    // D) CSE Section B — DBMS (CS201): EXACTLY 5 STUDENTS (Aditya, Sneha, Vikram, Pooja, Karan)
    for (const st of cseBStudents) {
      await Enrollment.create({
        student: st._id,
        institution: inst1._id,
        department: cseDept._id,
        course: btechCse._id,
        year: 2,
        semester: 1,
        section: 'B',
        subject: subDbms._id,
        academicYear: '2026-2027',
        status: 'ACTIVE',
        isActive: true
      });
    }

    // E) ECE Section A — Digital Electronics (EC201): EXACTLY 4 STUDENTS
    for (const st of eceStudents) {
      await Enrollment.create({
        student: st._id,
        institution: inst1._id,
        department: eceDept._id,
        course: btechEce._id,
        year: 2,
        semester: 1,
        section: 'A',
        subject: subDe._id,
        academicYear: '2026-2027',
        status: 'ACTIVE',
        isActive: true
      });
    }

    // ==========================================
    // 8. WEEKLY TIMETABLES (MON - SAT)
    // ==========================================
    console.log('Building weekly timetable matrix across Mon-Sat...');

    const timetableDefs = [
      // MONDAY
      { day: 1, start: '09:00', end: '10:00', sub: subDbms, fac: faculty1, room: 'CSE-201', sec: 'A', crs: btechCse, dept: cseDept },
      { day: 1, start: '10:00', end: '11:00', sub: subOs, fac: faculty3, room: 'CSE-201', sec: 'A', crs: btechCse, dept: cseDept },
      { day: 1, start: '11:15', end: '12:15', sub: subDs, fac: faculty2, room: 'CSE-201', sec: 'A', crs: btechCse, dept: cseDept },
      { day: 1, start: '10:00', end: '11:00', sub: subDbms, fac: faculty1, room: 'CSE-202', sec: 'B', crs: btechCse, dept: cseDept },

      // TUESDAY
      { day: 2, start: '09:00', end: '10:00', sub: subOs, fac: faculty3, room: 'CSE-201', sec: 'A', crs: btechCse, dept: cseDept },
      { day: 2, start: '10:00', end: '11:00', sub: subDbms, fac: faculty1, room: 'CSE-201', sec: 'A', crs: btechCse, dept: cseDept },
      { day: 2, start: '11:15', end: '12:15', sub: subDs, fac: faculty2, room: 'CSE-201', sec: 'A', crs: btechCse, dept: cseDept },
      { day: 2, start: '11:15', end: '12:15', sub: subDbms, fac: faculty1, room: 'CSE-202', sec: 'B', crs: btechCse, dept: cseDept },

      // WEDNESDAY
      { day: 3, start: '09:00', end: '10:00', sub: subDbms, fac: faculty1, room: 'CSE-201', sec: 'A', crs: btechCse, dept: cseDept },
      { day: 3, start: '10:00', end: '11:00', sub: subOs, fac: faculty3, room: 'CSE-201', sec: 'A', crs: btechCse, dept: cseDept },
      { day: 3, start: '11:15', end: '12:15', sub: subDs, fac: faculty2, room: 'CSE-201', sec: 'A', crs: btechCse, dept: cseDept },
      { day: 3, start: '10:00', end: '11:00', sub: subDbms, fac: faculty1, room: 'CSE-202', sec: 'B', crs: btechCse, dept: cseDept },

      // THURSDAY
      { day: 4, start: '09:00', end: '10:00', sub: subDbms, fac: faculty1, room: 'CSE-201', sec: 'A', crs: btechCse, dept: cseDept },
      { day: 4, start: '10:00', end: '11:00', sub: subDs, fac: faculty2, room: 'CSE-201', sec: 'A', crs: btechCse, dept: cseDept },
      { day: 4, start: '11:15', end: '12:15', sub: subOs, fac: faculty3, room: 'CSE-201', sec: 'A', crs: btechCse, dept: cseDept },
      { day: 4, start: '09:00', end: '10:00', sub: subDbms, fac: faculty1, room: 'CSE-202', sec: 'B', crs: btechCse, dept: cseDept },

      // FRIDAY
      { day: 5, start: '09:00', end: '10:00', sub: subDs, fac: faculty2, room: 'CSE-201', sec: 'A', crs: btechCse, dept: cseDept },
      { day: 5, start: '10:00', end: '11:00', sub: subOs, fac: faculty3, room: 'CSE-201', sec: 'A', crs: btechCse, dept: cseDept },
      { day: 5, start: '11:15', end: '12:15', sub: subDbms, fac: faculty1, room: 'CSE-201', sec: 'A', crs: btechCse, dept: cseDept },
      { day: 5, start: '10:00', end: '11:00', sub: subDbms, fac: faculty1, room: 'CSE-202', sec: 'B', crs: btechCse, dept: cseDept },

      // SATURDAY
      { day: 6, start: '09:00', end: '10:00', sub: subDbms, fac: faculty1, room: 'CSE-201', sec: 'A', crs: btechCse, dept: cseDept },
      { day: 6, start: '10:00', end: '11:00', sub: subDs, fac: faculty2, room: 'CSE-201', sec: 'A', crs: btechCse, dept: cseDept },
      { day: 6, start: '10:00', end: '11:00', sub: subDbms, fac: faculty1, room: 'CSE-202', sec: 'B', crs: btechCse, dept: cseDept },

      // SUNDAY / SPECIAL
      { day: 0, start: '10:00', end: '11:00', sub: subDbms, fac: faculty1, room: 'CSE-201', sec: 'A', crs: btechCse, dept: cseDept }
    ];

    for (const def of timetableDefs) {
      await Timetable.create({
        institution: inst1._id,
        department: def.dept._id,
        course: def.crs._id,
        year: 2,
        semester: 1,
        section: def.sec,
        subject: def.sub._id,
        faculty: def.fac._id,
        room: def.room,
        dayOfWeek: def.day,
        startTime: def.start,
        endTime: def.end,
        academicYear: '2026-2027',
        isActive: true
      });
    }

    // ==========================================
    // 9. HISTORICAL ATTENDANCE SESSIONS & RECORDS
    // ==========================================
    console.log('Generating historical attendance records for the 3 registered DBMS students...');

    // 20 past DBMS classes for Section A (Only 3 students enrolled!)
    for (let i = 1; i <= 20; i++) {
      const sessionDate = new Date(Date.now() - (22 - i) * 86400000);
      sessionDate.setHours(0, 0, 0, 0);

      const session = await ClassSession.create({
        institution: inst1._id,
        department: cseDept._id,
        course: btechCse._id,
        year: 2,
        semester: 1,
        section: 'A',
        subject: subDbms._id,
        faculty: faculty1._id,
        academicYear: '2026-2027',
        date: sessionDate,
        startTime: '09:00',
        endTime: '10:00',
        room: 'CSE-201',
        topic: `DBMS Unit Lecture ${i}`,
        status: 'COMPLETED',
        isFinalized: true,
        totalStudents: 3,
        presentCount: 2,
        absentCount: 1
      });

      // Chandini attended 17 out of 20 = 85%
      const chandiniStatus = [4, 11, 18].includes(i) ? 'ABSENT' : 'PRESENT';
      // Rahul attended 18 out of 20 = 90%
      const rahulStatus = [7, 15].includes(i) ? 'ABSENT' : 'PRESENT';
      // Priya attended 12 out of 20 = 60% (At Risk < 75%)
      const priyaStatus = [2, 5, 8, 10, 13, 16, 19, 20].includes(i) ? 'ABSENT' : 'PRESENT';

      await AttendanceRecord.create([
        {
          classSession: session._id,
          student: studentChandini._id,
          subject: subDbms._id,
          department: cseDept._id,
          course: btechCse._id,
          section: 'A',
          faculty: faculty1._id,
          institution: inst1._id,
          date: sessionDate,
          status: chandiniStatus
        },
        {
          classSession: session._id,
          student: studentRahul._id,
          subject: subDbms._id,
          department: cseDept._id,
          course: btechCse._id,
          section: 'A',
          faculty: faculty1._id,
          institution: inst1._id,
          date: sessionDate,
          status: rahulStatus
        },
        {
          classSession: session._id,
          student: studentPriya._id,
          subject: subDbms._id,
          department: cseDept._id,
          course: btechCse._id,
          section: 'A',
          faculty: faculty1._id,
          institution: inst1._id,
          date: sessionDate,
          status: priyaStatus
        }
      ]);
    }

    // ==========================================
    // 10. TODAY'S CLASS SESSIONS
    // ==========================================
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayDayOfWeek = today.getDay();

    console.log(`Setting up live class sessions for Today (Day ${todayDayOfWeek})...`);
    const todayEntries = await Timetable.find({ dayOfWeek: todayDayOfWeek });
    for (const entry of todayEntries) {
      const studentCount = await Enrollment.countDocuments({
        institution: entry.institution,
        subject: entry.subject,
        section: entry.section,
        status: 'ACTIVE',
        isActive: true
      });

      await ClassSession.create({
        institution: entry.institution,
        department: entry.department,
        course: entry.course,
        year: entry.year,
        semester: entry.semester,
        section: entry.section,
        subject: entry.subject,
        faculty: entry.faculty,
        timetable: entry._id,
        academicYear: entry.academicYear,
        date: today,
        startTime: entry.startTime,
        endTime: entry.endTime,
        room: entry.room,
        status: 'SCHEDULED',
        totalStudents: studentCount
      });
    }

    // ==========================================
    // 11. ASSIGNMENTS & SUBMISSIONS (SECTION-SCOPED)
    // ==========================================
    console.log('Creating Section-Scoped Assignments...');

    // Assignment 1: DBMS for CSE 2nd Year Section A ONLY (Only Chandini, Rahul, Priya can see it!)
    const assignDbms = await Assignment.create({
      title: 'DBMS Normalization & BCNF Decomposition Assignment',
      description: 'Design a normalized relational schema for a healthcare clinic. Provide functional dependency sets and 3NF/BCNF decomposition proofs.',
      instructions: 'Submit your solution in PDF or SQL format with sample table schemas.',
      subject: subDbms._id,
      course: btechCse._id,
      department: cseDept._id,
      year: 2,
      semester: 1,
      section: 'A',
      faculty: faculty1._id,
      institution: inst1._id,
      deadline: new Date(Date.now() + 7 * 86400000),
      maxMarks: 20,
      allowedFileTypes: ['pdf', 'sql', 'docx'],
      status: 'ACTIVE'
    });

    // Assignment 2: DSA for CSE 2nd Year Section A ONLY
    const assignDsa = await Assignment.create({
      title: 'DSA: Binary Search Tree & AVL Rotation Implementations',
      description: 'Implement AVL self-balancing tree rotations in C++ or Python with insert, delete and search operations.',
      instructions: 'Upload your source code (.cpp / .py) or a zip archive.',
      subject: subDs._id,
      course: btechCse._id,
      department: cseDept._id,
      year: 2,
      semester: 1,
      section: 'A',
      faculty: faculty2._id,
      institution: inst1._id,
      deadline: new Date(Date.now() + 10 * 86400000),
      maxMarks: 30,
      allowedFileTypes: ['cpp', 'py', 'zip', 'pdf'],
      status: 'ACTIVE'
    });

    // Chandini has submitted Assignment 1
    await AssignmentSubmission.create({
      assignment: assignDbms._id,
      student: studentChandini._id,
      institution: inst1._id,
      files: [{ filename: 'Chandini_24EG105Q39_DBMS_Assignment.pdf', url: '/uploads/demo/dbms1.pdf', mimetype: 'application/pdf' }],
      submittedAt: new Date(Date.now() - 1 * 86400000),
      status: 'GRADED',
      marks: 19,
      feedback: 'Excellent normalization proofs and clean schema design.',
      gradedBy: faculty1._id,
      gradedAt: new Date()
    });

    // Rahul has submitted Assignment 1
    await AssignmentSubmission.create({
      assignment: assignDbms._id,
      student: studentRahul._id,
      institution: inst1._id,
      files: [{ filename: 'Rahul_24EG105Q01_DBMS.pdf', url: '/uploads/demo/dbms_rahul.pdf', mimetype: 'application/pdf' }],
      submittedAt: new Date(Date.now() - 2 * 86400000),
      status: 'SUBMITTED',
      marks: null
    });

    // Priya's submission is pending

    // Notification for Chandini
    await Notification.create({
      user: studentChandini._id,
      institution: inst1._id,
      type: 'ASSIGNMENT_GRADED',
      title: 'Assignment Graded: Database Management Systems',
      message: 'Your submission for "DBMS Normalization & BCNF Decomposition" has been evaluated. Score: 19/20 marks.',
      link: '/student/assignments',
      isRead: false
    });

    console.log('✨ Seed database loaded with 100% Real Database Relationships & Roll Numbers!');
    console.log('===========================================================');
    console.log('🔑 REAL CREDENTIALS (Password: Demo@1234):');
    console.log('1. Student (Chandini):  24EG105Q39  OR  student@campusflow.demo');
    console.log('2. Student (Rahul):     24EG105Q01  OR  rahul.sharma@campusflow.demo');
    console.log('3. Student (Priya):     24EG105Q02  OR  priya.patel@campusflow.demo');
    console.log('4. Faculty (Dr. Chen):  faculty@campusflow.demo');
    console.log('5. College Admin:       admin@campusflow.demo');
    console.log('6. Placement Officer:   placement@campusflow.demo');
    console.log('7. Super Admin:         superadmin@campusflow.demo');
    console.log('===========================================================');

    process.exit(0);
  } catch (err) {
    console.error('❌ Seeding failed:', err);
    process.exit(1);
  }
};

runSeeder();
