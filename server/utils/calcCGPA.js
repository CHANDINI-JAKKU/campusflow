import Grade from '../models/Grade.js';

const GRADE_POINTS = { 'O': 10, 'A+': 9, 'A': 8, 'B+': 7, 'B': 6, 'C': 5, 'F': 0 };

const getGrade = (percentage) => {
  if (percentage >= 90) return 'O';
  if (percentage >= 80) return 'A+';
  if (percentage >= 70) return 'A';
  if (percentage >= 60) return 'B+';
  if (percentage >= 50) return 'B';
  if (percentage >= 40) return 'C';
  return 'F';
};

export const calcGradePoints = (percentage) => {
  const grade = getGrade(percentage);
  return { grade, gradePoints: GRADE_POINTS[grade] };
};

export const calcSGPA = (grades) => {
  if (!grades.length) return 0;
  let totalCredits = 0;
  let weightedPoints = 0;
  for (const g of grades) {
    const credits = g.subject?.credits || 3;
    totalCredits += credits;
    weightedPoints += g.gradePoints * credits;
  }
  return totalCredits > 0 ? parseFloat((weightedPoints / totalCredits).toFixed(2)) : 0;
};

export const calcCGPA = async (studentId) => {
  const grades = await Grade.find({ student: studentId, isFinalized: true })
    .populate('subject', 'credits');
  if (!grades.length) return 0;
  let totalCredits = 0;
  let weightedPoints = 0;
  for (const g of grades) {
    const credits = g.subject?.credits || 3;
    totalCredits += credits;
    weightedPoints += g.gradePoints * credits;
  }
  return totalCredits > 0 ? parseFloat((weightedPoints / totalCredits).toFixed(2)) : 0;
};
