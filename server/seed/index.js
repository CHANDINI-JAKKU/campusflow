import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import connectDB from '../config/db.js';
import User from '../models/User.js';
import Institution from '../models/Institution.js';
import Department from '../models/Department.js';
import Course from '../models/Course.js';
import Subject from '../models/Subject.js';
import Enrollment from '../models/Enrollment.js';
import Attendance from '../models/Attendance.js';
import AttendanceRecord from '../models/AttendanceRecord.js';
import Assignment from '../models/Assignment.js';
import AssignmentSubmission from '../models/AssignmentSubmission.js';
import Grade from '../models/Grade.js';
import AcademicRecord from '../models/AcademicRecord.js';
import Company from '../models/Company.js';
import JobDrive from '../models/JobDrive.js';
import JobApplication from '../models/JobApplication.js';
import PlacementOutcome from '../models/PlacementOutcome.js';
import Event from '../models/Event.js';
import Announcement from '../models/Announcement.js';
import StudentRequest from '../models/StudentRequest.js';
import Notification from '../models/Notification.js';
import dotenv from 'dotenv';

dotenv.config();

const runSeeder = async () => {
  try {
    await connectDB();
    const isReset = process.argv.includes('--reset') || true;

    if (isReset) {
      console.log('🧹 Clearing existing database collections...');
      await mongoose.connection.dropDatabase();
    }

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
      phone: '+1 (555) 000-0001',
      isActive: true,
      isEmailVerified: true
    });

    const inst1 = await Institution.create({
      name: 'Sunrise University of Technology',
      code: 'SUN01',
      address: '742 Evergreen Academic Way, Metro City',
      phone: '+1 (555) 010-0100',
      email: 'contact@sunrise.edu',
      website: 'https://sunrise.campusflow.demo',
      type: 'UNIVERSITY',
      establishedYear: 1985,
      isActive: true,
      adminUser: superAdmin._id
    });

    const inst2 = await Institution.create({
      name: 'Apex Institute of Engineering',
      code: 'APEX02',
      address: '100 Silicon Boulevard, Tech Valley',
      phone: '+1 (555) 020-0200',
      email: 'admissions@apex.edu',
      website: 'https://apex.campusflow.demo',
      type: 'COLLEGE',
      establishedYear: 2002,
      isActive: true,
      adminUser: superAdmin._id
    });

    // ==========================================
    // 2. COLLEGE ADMINS
    // ==========================================
    const admin1 = await User.create({
      firstName: 'Eleanor',
      lastName: 'Vance',
      email: 'admin@campusflow.demo',
      password: hashedPwd,
      role: 'COLLEGE_ADMIN',
      institution: inst1._id,
      phone: '+1 (555) 010-0101',
      isActive: true,
      isEmailVerified: true
    });

    const admin2 = await User.create({
      firstName: 'Marcus',
      lastName: 'Holloway',
      email: 'admin2@campusflow.demo',
      password: hashedPwd,
      role: 'COLLEGE_ADMIN',
      institution: inst2._id,
      isActive: true
    });

    // ==========================================
    // 3. DEPARTMENTS
    // ==========================================
    const cseDept = await Department.create({
      name: 'Computer Science and Engineering',
      code: 'CSE',
      institution: inst1._id,
      description: 'Department of Computer Science & Software Engineering',
      isActive: true
    });

    const eceDept = await Department.create({
      name: 'Electronics and Communication',
      code: 'ECE',
      institution: inst1._id,
      description: 'Department of Microelectronics, VLSI & Communications',
      isActive: true
    });

    const mbaDept = await Department.create({
      name: 'School of Management Studies',
      code: 'MBA',
      institution: inst1._id,
      description: 'Business administration, analytics and finance',
      isActive: true
    });

    // ==========================================
    // 4. FACULTY MEMBERS
    // ==========================================
    const faculty1 = await User.create({
      firstName: 'Dr. Robert',
      lastName: 'Chen',
      email: 'faculty@campusflow.demo',
      password: hashedPwd,
      role: 'FACULTY',
      institution: inst1._id,
      department: cseDept._id,
      employeeId: 'FAC-CSE-001',
      phone: '+1 (555) 010-0201',
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
      skills: ['Operating Systems', 'Cloud Architecture', 'Linux'],
      isActive: true
    });

    // Update Head of Department
    cseDept.head = faculty1._id;
    await cseDept.save();

    // ==========================================
    // 5. PLACEMENT OFFICER
    // ==========================================
    const placementOfficer = await User.create({
      firstName: 'Samantha',
      lastName: 'Reed',
      email: 'placement@campusflow.demo',
      password: hashedPwd,
      role: 'PLACEMENT_OFFICER',
      institution: inst1._id,
      employeeId: 'TPO-001',
      phone: '+1 (555) 010-0301',
      isActive: true
    });

    // ==========================================
    // 6. COURSES & SUBJECTS
    // ==========================================
    const btechCse = await Course.create({
      name: 'B.Tech in Computer Science and Engineering',
      code: 'BTECH-CSE',
      department: cseDept._id,
      institution: inst1._id,
      semester: 3,
      year: 2,
      credits: 24,
      description: '4-Year Undergraduate Program in Computer Science',
      isActive: true
    });

    const subjectDbms = await Subject.create({
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

    const subjectDs = await Subject.create({
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

    const subjectOs = await Subject.create({
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

    const subjectMath = await Subject.create({
      name: 'Discrete Mathematical Structures',
      code: 'CS204',
      course: btechCse._id,
      department: cseDept._id,
      institution: inst1._id,
      faculty: faculty1._id,
      credits: 3,
      maxInternalMarks: 30,
      maxExternalMarks: 70
    });

    // ==========================================
    // 7. DEMO STUDENT & COHORT
    // ==========================================
    const demoStudent = await User.create({
      firstName: 'Alex',
      lastName: 'Morgan',
      email: 'student@campusflow.demo',
      password: hashedPwd,
      role: 'STUDENT',
      institution: inst1._id,
      department: cseDept._id,
      rollNumber: 'CS202601',
      year: 2,
      semester: 3,
      section: 'A',
      phone: '+1 (555) 010-0401',
      profileCompletion: 85,
      skills: ['React', 'JavaScript', 'Node.js', 'Python', 'SQL', 'Git'],
      github: 'https://github.com/alexmorgan-demo',
      linkedin: 'https://linkedin.com/in/alexmorgan-demo',
      isActive: true,
      isEmailVerified: true
    });

    await Enrollment.create({
      student: demoStudent._id,
      course: btechCse._id,
      institution: inst1._id,
      department: cseDept._id,
      academicYear: '2026-2027',
      semester: 3,
      isActive: true
    });

    // Create 15 fellow cohort students for realistic class listings
    const otherStudents = [];
    const cohortNames = [
      ['Liam', 'Smith'], ['Emma', 'Johnson'], ['Noah', 'Williams'], ['Olivia', 'Brown'],
      ['James', 'Jones'], ['Ava', 'Garcia'], ['William', 'Miller'], ['Sophia', 'Davis'],
      ['Benjamin', 'Rodriguez'], ['Isabella', 'Martinez'], ['Lucas', 'Hernandez'], ['Mia', 'Lopez'],
      ['Henry', 'Gonzalez'], ['Harper', 'Wilson'], ['Alexander', 'Anderson']
    ];

    for (let i = 0; i < cohortNames.length; i++) {
      const s = await User.create({
        firstName: cohortNames[i][0],
        lastName: cohortNames[i][1],
        email: `${cohortNames[i][0].toLowerCase()}.${cohortNames[i][1].toLowerCase()}@campusflow.demo`,
        password: hashedPwd,
        role: 'STUDENT',
        institution: inst1._id,
        department: cseDept._id,
        rollNumber: `CS2026${(i + 2).toString().padStart(2, '0')}`,
        year: 2,
        semester: 3,
        section: 'A',
        isActive: true
      });
      await Enrollment.create({
        student: s._id,
        course: btechCse._id,
        institution: inst1._id,
        department: cseDept._id,
        academicYear: '2026-2027',
        semester: 3,
        isActive: true
      });
      otherStudents.push(s);
    }

    const allStudents = [demoStudent, ...otherStudents];

    // ==========================================
    // 8. ATTENDANCE SESSIONS & RECORDS
    // ==========================================
    // Create 20 historical sessions for DBMS (Alex has 12 Present, 8 Absent = 60% attendance -> AT RISK!)
    for (let i = 1; i <= 20; i++) {
      const date = new Date(Date.now() - (21 - i) * 24 * 60 * 60 * 1000);
      const session = await Attendance.create({
        subject: subjectDbms._id,
        faculty: faculty1._id,
        institution: inst1._id,
        department: cseDept._id,
        date,
        sessionType: i % 4 === 0 ? 'LAB' : 'LECTURE',
        topic: `DBMS Unit ${Math.ceil(i / 4)}: Lecture ${i}`,
        isFinalized: true
      });

      // Alex is absent on 8 of these sessions (60% attendance)
      const alexStatus = [2, 5, 8, 11, 14, 16, 18, 20].includes(i) ? 'ABSENT' : 'PRESENT';

      const records = allStudents.map((st) => ({
        attendance: session._id,
        student: st._id,
        status: st._id.equals(demoStudent._id) ? alexStatus : (Math.random() > 0.15 ? 'PRESENT' : 'ABSENT'),
        institution: inst1._id
      }));

      await AttendanceRecord.insertMany(records);
    }

    // Create 20 historical sessions for Data Structures (Alex has 17 Present, 3 Absent = 85% attendance -> HEALTHY)
    for (let i = 1; i <= 20; i++) {
      const date = new Date(Date.now() - (21 - i) * 24 * 60 * 60 * 1000);
      const session = await Attendance.create({
        subject: subjectDs._id,
        faculty: faculty2._id,
        institution: inst1._id,
        department: cseDept._id,
        date,
        sessionType: 'LECTURE',
        topic: `DSA Topic: Trees & Dynamic Programming Part ${i}`,
        isFinalized: true
      });

      const alexStatus = [4, 9, 15].includes(i) ? 'ABSENT' : 'PRESENT';

      const records = allStudents.map((st) => ({
        attendance: session._id,
        student: st._id,
        status: st._id.equals(demoStudent._id) ? alexStatus : 'PRESENT',
        institution: inst1._id
      }));

      await AttendanceRecord.insertMany(records);
    }

    // ==========================================
    // 9. ASSIGNMENTS & SUBMISSIONS
    // ==========================================
    const assign1 = await Assignment.create({
      title: 'ER-Modeling & Relational Schema Normalization (3NF/BCNF)',
      description: 'Design an end-to-end normalized relational schema for a multi-tenant hospital management system. Submit ER diagram and SQL schema definitions.',
      subject: subjectDbms._id,
      course: btechCse._id,
      faculty: faculty1._id,
      institution: inst1._id,
      department: cseDept._id,
      deadline: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // Past deadline
      maxMarks: 50,
      allowedFileTypes: ['pdf', 'sql'],
      status: 'ACTIVE'
    });

    const assign2 = await Assignment.create({
      title: 'AVL Tree & Red-Black Tree Implementation in C++',
      description: 'Implement self-balancing binary search trees with insertion, deletion and rotation operations. Include unit test cases.',
      subject: subjectDs._id,
      course: btechCse._id,
      faculty: faculty2._id,
      institution: inst1._id,
      department: cseDept._id,
      deadline: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000), // Upcoming deadline
      maxMarks: 50,
      allowedFileTypes: ['cpp', 'pdf', 'zip'],
      status: 'ACTIVE'
    });

    const assign3 = await Assignment.create({
      title: 'Multithreading & IPC Synchronization in Linux',
      description: 'Solve the Producer-Consumer problem using POSIX semaphores and mutex locks with shared memory.',
      subject: subjectOs._id,
      course: btechCse._id,
      faculty: faculty3._id,
      institution: inst1._id,
      department: cseDept._id,
      deadline: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
      maxMarks: 40,
      status: 'ACTIVE'
    });

    // Submissions for Alex
    await AssignmentSubmission.create({
      assignment: assign1._id,
      student: demoStudent._id,
      institution: inst1._id,
      files: [{ filename: 'AlexMorgan_DBMS_Assignment1.pdf', url: '/uploads/demo/dbms1.pdf', mimetype: 'application/pdf' }],
      submittedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
      status: 'GRADED',
      marks: 38,
      feedback: 'Good schema design overall. Weak on BCNF decomposition examples. Review anomalies in 3NF.',
      gradedBy: faculty1._id,
      gradedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
    });

    // ==========================================
    // 10. GRADES & ACADEMIC RECORDS
    // ==========================================
    // Semester 1 Record
    await Grade.create({
      student: demoStudent._id,
      subject: subjectDbms._id,
      course: btechCse._id,
      institution: inst1._id,
      department: cseDept._id,
      semester: 1,
      academicYear: '2025-2026',
      totalInternal: 24,
      totalExternal: 56,
      total: 80,
      grade: 'A+',
      gradePoints: 9,
      isFinalized: true
    });

    // Semester 2 Record
    await Grade.create({
      student: demoStudent._id,
      subject: subjectDs._id,
      course: btechCse._id,
      institution: inst1._id,
      department: cseDept._id,
      semester: 2,
      academicYear: '2025-2026',
      totalInternal: 22,
      totalExternal: 51,
      total: 73,
      grade: 'A',
      gradePoints: 8,
      isFinalized: true
    });

    await AcademicRecord.create({
      student: demoStudent._id,
      institution: inst1._id,
      semester: 1,
      academicYear: '2025-2026',
      sgpa: 8.5,
      cgpa: 8.5,
      totalCredits: 20,
      earnedCredits: 20
    });

    await AcademicRecord.create({
      student: demoStudent._id,
      institution: inst1._id,
      semester: 2,
      academicYear: '2025-2026',
      sgpa: 7.8,
      cgpa: 8.15,
      totalCredits: 22,
      earnedCredits: 22
    });

    // ==========================================
    // 11. COMPANIES & JOB DRIVES
    // ==========================================
    const google = await Company.create({
      name: 'Google LLC',
      industry: 'Software & Cloud Computing',
      website: 'https://careers.google.com',
      location: 'Mountain View, CA / Hyderabad',
      description: 'Global technology leader specializing in internet-related services, cloud, and AI.',
      minPackage: 18,
      maxPackage: 32,
      jobRoles: ['Software Development Engineer', 'Cloud Systems Engineer'],
      requiredSkills: ['Data Structures', 'Algorithms', 'C++', 'Java', 'Distributed Systems'],
      institution: inst1._id,
      isActive: true
    });

    const amazon = await Company.create({
      name: 'Amazon Web Services',
      industry: 'E-Commerce & Cloud Infrastructure',
      website: 'https://amazon.jobs',
      location: 'Seattle, WA / Bangalore',
      description: 'World leading cloud platform offering scalable compute, storage, and database solutions.',
      minPackage: 15,
      maxPackage: 28,
      jobRoles: ['SDE-1', 'Systems Development Engineer'],
      requiredSkills: ['Java', 'Object Oriented Programming', 'AWS', 'SQL'],
      institution: inst1._id,
      isActive: true
    });

    const microsoft = await Company.create({
      name: 'Microsoft Corporation',
      industry: 'Software, Hardware & AI',
      website: 'https://careers.microsoft.com',
      location: 'Redmond, WA / Noida',
      minPackage: 16,
      maxPackage: 30,
      jobRoles: ['Software Engineer', 'Full Stack Developer'],
      requiredSkills: ['React', 'TypeScript', 'Node.js', 'C#', 'Azure'],
      institution: inst1._id,
      isActive: true
    });

    // Job Drive 1: Google (Requires CGPA >= 8.0, Attendance >= 75%)
    const googleDrive = await JobDrive.create({
      company: google._id,
      institution: inst1._id,
      role: 'Associate Software Engineer (2026 Batch)',
      description: 'Looking for high-caliber problem solvers with strong algorithm intuition and system modeling fundamentals.',
      location: 'Hyderabad / Bangalore',
      package: 24,
      eligibility: {
        minCGPA: 8.0,
        minAttendance: 75,
        maxBacklogs: 0,
        departments: [cseDept._id, eceDept._id],
        graduationYear: 2026
      },
      requiredSkills: ['Data Structures', 'Algorithms', 'C++', 'System Design'],
      applicationDeadline: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
      status: 'ACTIVE',
      placementOfficer: placementOfficer._id
    });

    // Job Drive 2: Microsoft (Requires CGPA >= 7.5, Attendance >= 70%)
    const msftDrive = await JobDrive.create({
      company: microsoft._id,
      institution: inst1._id,
      role: 'Full Stack Web Developer (React + Node)',
      description: 'Build mission critical web services and modern interactive experiences for enterprise customers.',
      location: 'Noida / Hyderabad',
      package: 18,
      eligibility: {
        minCGPA: 7.5,
        minAttendance: 70,
        maxBacklogs: 0,
        departments: [cseDept._id],
        graduationYear: 2026
      },
      requiredSkills: ['React', 'Node.js', 'JavaScript', 'MongoDB', 'REST APIs'],
      applicationDeadline: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000),
      status: 'ACTIVE',
      placementOfficer: placementOfficer._id
    });

    // Alex applied to Microsoft Drive
    await JobApplication.create({
      drive: msftDrive._id,
      student: demoStudent._id,
      institution: inst1._id,
      status: 'SHORTLISTED',
      appliedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
    });

    // Record one past offer for platform metrics
    await PlacementOutcome.create({
      student: otherStudents[0]._id,
      company: amazon._id,
      drive: msftDrive._id,
      institution: inst1._id,
      role: 'SDE-1',
      package: 22,
      joiningDate: new Date('2026-07-01'),
      status: 'OFFERED'
    });

    // ==========================================
    // 12. EVENTS & ANNOUNCEMENTS
    // ==========================================
    await Event.create({
      title: 'National Hackathon 2026: AI & Smart Campus Innovations',
      description: '36-hour flagship hackathon bringing together top collegiate developers to build next-gen smart campus tools.',
      institution: inst1._id,
      department: cseDept._id,
      eventType: 'HACKATHON',
      date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      startTime: '09:00 AM',
      endTime: '09:00 PM',
      venue: 'Main Auditorium & Innovation Lab',
      organizer: faculty1._id,
      capacity: 150,
      audience: 'ALL',
      isActive: true
    });

    await Announcement.create({
      title: 'Mid-Semester Examination Schedule & Rules Released',
      content: 'The Mid-Semester exams for B.Tech Semester 3 will commence on the 15th of next month. Ensure minimum 75% attendance for hall ticket issuance.',
      institution: inst1._id,
      department: cseDept._id,
      createdBy: admin1._id,
      audience: 'STUDENTS',
      priority: 'URGENT',
      isActive: true
    });

    await Announcement.create({
      title: 'Google & Microsoft Campus Placement Drive Registration Open',
      content: 'Eligible 2026 batch students from CSE & ECE can now apply directly via the Placement portal. Check your eligibility criteria before submitting.',
      institution: inst1._id,
      createdBy: placementOfficer._id,
      audience: 'STUDENTS',
      priority: 'IMPORTANT',
      isActive: true
    });

    // ==========================================
    // 13. STUDENT REQUESTS & NOTIFICATIONS
    // ==========================================
    await StudentRequest.create({
      student: demoStudent._id,
      institution: inst1._id,
      department: cseDept._id,
      type: 'BONAFIDE',
      subject: 'Bonafide Certificate for National Hackathon Travel Grant',
      description: 'Requesting a formal institutional bonafide letter to submit for travel grant sponsorship to attend the National Collegiate Hackathon.',
      status: 'APPROVED',
      resolvedBy: admin1._id,
      resolvedAt: new Date(),
      workflow: [
        { action: 'SUBMITTED', performedBy: demoStudent._id, comment: 'Application submitted with event brochure', timestamp: new Date(Date.now() - 48 * 3600000) },
        { action: 'APPROVE', performedBy: admin1._id, comment: 'Approved. Certificate generated.', timestamp: new Date(Date.now() - 12 * 3600000) }
      ]
    });

    // Trigger important notifications for Alex
    await Notification.create({
      user: demoStudent._id,
      institution: inst1._id,
      type: 'ATTENDANCE_WARNING',
      title: '⚠️ Attendance Warning: Database Management Systems',
      message: 'Your attendance in CS201 (DBMS) is currently 60% (12/20 classes). You need 12 consecutive classes to reach the 75% required threshold.',
      link: '/student/attendance',
      isRead: false
    });

    await Notification.create({
      user: demoStudent._id,
      institution: inst1._id,
      type: 'APPLICATION_UPDATE',
      title: '🎉 Application Shortlisted: Microsoft',
      message: 'You have been shortlisted for Round 1 Technical Interview for Full Stack Web Developer role at Microsoft.',
      link: '/student/placements',
      isRead: false
    });

    await Notification.create({
      user: demoStudent._id,
      institution: inst1._id,
      type: 'ASSIGNMENT_GRADED',
      title: 'Assignment Graded: ER-Modeling',
      message: 'Dr. Robert Chen has graded your submission. Marks: 38/50. View feedback in the assignment tab.',
      link: '/student/assignments',
      isRead: true
    });

    console.log('✨ Seed database populated with realistic multi-tenant data!');
    console.log('===========================================================');
    console.log('🔑 DEMO CREDENTIALS (Password for all: Demo@1234):');
    console.log('1. Super Admin:      superadmin@campusflow.demo');
    console.log('2. College Admin:    admin@campusflow.demo');
    console.log('3. Faculty (CSE):    faculty@campusflow.demo');
    console.log('4. Placement Officer: placement@campusflow.demo');
    console.log('5. Student (Alex):   student@campusflow.demo');
    console.log('===========================================================');

    process.exit(0);
  } catch (err) {
    console.error('❌ Seeding failed:', err);
    process.exit(1);
  }
};

runSeeder();
