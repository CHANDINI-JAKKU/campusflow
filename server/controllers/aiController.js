import AIConversation from '../models/AIConversation.js';
import StudyPlan from '../models/StudyPlan.js';
import JobDrive from '../models/JobDrive.js';
import User from '../models/User.js';
import Grade from '../models/Grade.js';
import { aiChat } from '../ai/provider.js';
import * as prompts from '../ai/prompts.js';
import asyncHandler from '../utils/asyncHandler.js';
import ApiResponse from '../utils/ApiResponse.js';
import ApiError from '../utils/ApiError.js';
import { calcOverallAttendance } from '../utils/calcAttendance.js';
import { calcCGPA } from '../utils/calcCGPA.js';

// Helper to parse JSON from LLM response (in case it includes markdown backticks)
const parseJSON = (str) => {
  try {
    const jsonStr = str.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(jsonStr);
  } catch (e) {
    console.error('Failed to parse AI response as JSON:', str);
    throw new ApiError(500, 'Failed to parse AI response');
  }
};

// POST /api/ai/academic-summary
export const generateAcademicSummary = asyncHandler(async (req, res) => {
  const { studentId } = req.body;
  const student = await User.findById(studentId).populate('department');
  
  const [cgpa, { percentage: attendance }] = await Promise.all([
    calcCGPA(studentId),
    calcOverallAttendance(studentId)
  ]);
  
  const grades = await Grade.find({ student: studentId }).populate('subject');
  const subjects = grades.map(g => ({
    name: g.subject?.name,
    marks: g.total,
    maxMarks: (g.subject?.maxInternalMarks || 30) + (g.subject?.maxExternalMarks || 70),
    percentage: Math.round((g.total / ((g.subject?.maxInternalMarks || 30) + (g.subject?.maxExternalMarks || 70))) * 100),
    attendance: 80 // Simplified for this demo endpoint
  }));

  const studentData = {
    name: `${student.firstName} ${student.lastName}`,
    department: student.department?.name,
    semester: student.semester,
    cgpa,
    attendance,
    subjects,
    assignmentsCompleted: 5, // Mocked for summary
    assignmentsPending: 2,
    assignmentsLate: 1
  };

  const prompt = prompts.academicSummaryPrompt(studentData);
  const response = await aiChat([{ role: 'user', content: prompt }]);
  
  res.json(new ApiResponse(200, parseJSON(response)));
});

// POST /api/ai/study-plan
export const generateStudyPlan = asyncHandler(async (req, res) => {
  const { examDate, hoursPerDay, subjects, weakSubjects } = req.body;
  
  const prompt = prompts.studyPlanPrompt({
    name: req.user.firstName,
    examDate,
    hoursPerDay,
    subjects,
    weakSubjects
  });

  const response = await aiChat([{ role: 'user', content: prompt }]);
  const planData = parseJSON(response);

  const studyPlan = await StudyPlan.create({
    student: req.user._id,
    institution: req.user.institution,
    title: planData.title,
    examDate: new Date(examDate),
    hoursPerDay,
    subjects,
    schedule: planData.schedule,
    aiGenerated: true,
    progress: 0
  });

  res.status(201).json(new ApiResponse(201, { studyPlan }));
});

// POST /api/ai/chat
export const chatWithAssistant = asyncHandler(async (req, res) => {
  const { message } = req.body;
  
  let conversation = await AIConversation.findOne({ student: req.user._id });
  if (!conversation) {
    const systemContent = prompts.studyAssistantSystemPrompt({
      studentName: req.user.firstName,
      courses: ['Computer Science'],
      weakSubjects: ['Database Systems']
    });
    
    conversation = await AIConversation.create({
      student: req.user._id,
      institution: req.user.institution,
      messages: [
        { role: 'assistant', content: 'Hello! I am your CampusFlow AI Study Assistant. How can I help you today?', timestamp: new Date() }
      ],
      context: {}
    });
  }

  // Add user message
  conversation.messages.push({ role: 'user', content: message, timestamp: new Date() });
  
  // Format for AI provider (system prompt + history)
  const aiMessages = conversation.messages.map(m => ({
    role: m.role,
    content: m.content
  }));
  // Insert system prompt dynamically at the top
  aiMessages.unshift({
    role: 'system',
    content: prompts.studyAssistantSystemPrompt({
      studentName: req.user.firstName
    })
  });

  // Call AI
  const aiResponseContent = await aiChat(aiMessages);
  
  // Save AI response
  conversation.messages.push({ role: 'assistant', content: aiResponseContent, timestamp: new Date() });
  await conversation.save();

  res.json(new ApiResponse(200, { message: aiResponseContent, conversation }));
});

// GET /api/ai/chat/history
export const getChatHistory = asyncHandler(async (req, res) => {
  const conversation = await AIConversation.findOne({ student: req.user._id });
  res.json(new ApiResponse(200, { conversation }));
});

// DELETE /api/ai/chat/history
export const clearChatHistory = asyncHandler(async (req, res) => {
  await AIConversation.findOneAndDelete({ student: req.user._id });
  res.json(new ApiResponse(200, null, 'Chat history cleared'));
});

// POST /api/ai/career-match
export const evaluateCareerMatch = asyncHandler(async (req, res) => {
  const { driveId } = req.body;
  const drive = await JobDrive.findById(driveId).populate('company');
  const student = await User.findById(req.user._id);
  const cgpa = await calcCGPA(req.user._id);
  
  const studentProfile = {
    name: student.firstName,
    cgpa,
    skills: student.skills,
    projects: ['Library Management System', 'Portfolio Website'], // Example mock data
    certifications: ['AWS Cloud Practitioner']
  };

  const jobDrive = {
    company: drive.company.name,
    role: drive.role,
    requiredSkills: drive.requiredSkills,
    minCGPA: drive.eligibility?.minCGPA || 0,
    package: drive.package
  };

  const prompt = prompts.careerMatchPrompt({ studentProfile, jobDrive });
  const response = await aiChat([{ role: 'user', content: prompt }]);
  
  res.json(new ApiResponse(200, parseJSON(response)));
});
