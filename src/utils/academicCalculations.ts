import { Assessment, Subject, SubjectAcademicSummary } from '../types';

/**
 * Standard Grade Scale conversion (10-point scale common in universities)
 */
export function getGradeDetails(percentage: number | null): { letter: string; letterGrade: string; gpa: number; color: string; label: string } {
  if (percentage === null || isNaN(percentage)) {
    return { letter: '—', letterGrade: '—', gpa: 0, color: '#A8B3C7', label: 'Not Evaluated' };
  }

  if (percentage >= 90) {
    return { letter: 'O', letterGrade: 'O', gpa: 10.0, color: '#10B981', label: 'Outstanding' };
  } else if (percentage >= 80) {
    return { letter: 'A+', letterGrade: 'A+', gpa: 9.0, color: '#34D399', label: 'Excellent' };
  } else if (percentage >= 70) {
    return { letter: 'A', letterGrade: 'A', gpa: 8.0, color: '#38BDF8', label: 'Very Good' };
  } else if (percentage >= 60) {
    return { letter: 'B+', letterGrade: 'B+', gpa: 7.0, color: '#8B80FF', label: 'Good' };
  } else if (percentage >= 50) {
    return { letter: 'B', letterGrade: 'B', gpa: 6.0, color: '#FBBF24', label: 'Above Average' };
  } else if (percentage >= 40) {
    return { letter: 'C', letterGrade: 'C', gpa: 5.0, color: '#F97316', label: 'Pass' };
  } else {
    return { letter: 'RA', letterGrade: 'RA', gpa: 0.0, color: '#F87171', label: 'Re-appear' };
  }
}

/**
 * Compute academic metrics for a single subject based on its assessments.
 * Transparently supports raw percentage or weighted scheme without assuming false values.
 */
export function calculateSubjectAcademicSummary(
  subject: Subject,
  assessments: Assessment[]
): SubjectAcademicSummary {
  const subjectAssessments = assessments.filter(a => a.subjectId === subject.id);

  const isWeighted = subject.gradingScheme === 'weighted';
  const targetPercentage = subject.targetPercentage ?? 80;

  // Graded assessments (must have a valid obtainedMarks number and status === 'graded')
  const gradedAssessments = subjectAssessments.filter(
    a => a.status === 'graded' && typeof a.obtainedMarks === 'number' && !isNaN(a.obtainedMarks)
  );

  // Ungraded / upcoming assessments
  const remainingAssessments = subjectAssessments.filter(
    a => a.status !== 'graded' || a.obtainedMarks === null || a.obtainedMarks === undefined
  );

  let totalConfiguredWeight = 0;
  let gradedWeight = 0;
  let currentPercentage: number | null = null;
  let projectedPercentage: number | null = null;
  let isTargetAchievable = true;
  let requiredRemainingPercentage: number | null = null;

  if (isWeighted) {
    // Weighted scheme: weightagePercentage contributions
    totalConfiguredWeight = subjectAssessments.reduce((acc, a) => acc + (a.weightagePercentage || 0), 0);
    gradedWeight = gradedAssessments.reduce((acc, a) => acc + (a.weightagePercentage || 0), 0);

    let earnedWeightedScore = 0;
    gradedAssessments.forEach(a => {
      const weight = a.weightagePercentage || 0;
      const proportion = a.maximumMarks > 0 ? (a.obtainedMarks! / a.maximumMarks) : 0;
      earnedWeightedScore += proportion * weight;
    });

    if (gradedWeight > 0) {
      currentPercentage = Math.round((earnedWeightedScore / gradedWeight) * 1000) / 10;
    }

    // Baseline projected percentage (if student gets 0 on remaining):
    projectedPercentage = Math.round(earnedWeightedScore * 10) / 10;

    // Remaining weight available
    const remainingWeight = Math.max(0, 100 - gradedWeight);

    if (remainingWeight > 0) {
      // Points needed to reach target: targetPercentage - earnedWeightedScore
      const scoreNeeded = targetPercentage - earnedWeightedScore;
      if (scoreNeeded <= 0) {
        // Target is already locked in!
        requiredRemainingPercentage = 0;
        isTargetAchievable = true;
      } else if (scoreNeeded > remainingWeight) {
        // Even 100% on remaining assessments won't reach the target
        isTargetAchievable = false;
        requiredRemainingPercentage = Math.round((scoreNeeded / remainingWeight) * 1000) / 10;
      } else {
        isTargetAchievable = true;
        requiredRemainingPercentage = Math.round((scoreNeeded / remainingWeight) * 1000) / 10;
      }
    } else {
      isTargetAchievable = (currentPercentage ?? 0) >= targetPercentage;
      requiredRemainingPercentage = null;
    }

  } else {
    // Raw Marks scheme: sum of obtained marks / sum of max marks
    const totalGradedObtained = gradedAssessments.reduce((acc, a) => acc + (a.obtainedMarks || 0), 0);
    const totalGradedMax = gradedAssessments.reduce((acc, a) => acc + (a.maximumMarks || 0), 0);

    if (totalGradedMax > 0) {
      currentPercentage = Math.round((totalGradedObtained / totalGradedMax) * 1000) / 10;
    }

    const remainingMaxMarks = remainingAssessments.reduce((acc, a) => acc + (a.maximumMarks || 0), 0);
    const allTotalMax = totalGradedMax + remainingMaxMarks;

    if (allTotalMax > 0 && remainingMaxMarks > 0) {
      const targetTotalMarks = (targetPercentage / 100) * allTotalMax;
      const marksNeeded = targetTotalMarks - totalGradedObtained;

      if (marksNeeded <= 0) {
        requiredRemainingPercentage = 0;
        isTargetAchievable = true;
      } else if (marksNeeded > remainingMaxMarks) {
        isTargetAchievable = false;
        requiredRemainingPercentage = Math.round((marksNeeded / remainingMaxMarks) * 1000) / 10;
      } else {
        isTargetAchievable = true;
        requiredRemainingPercentage = Math.round((marksNeeded / remainingMaxMarks) * 1000) / 10;
      }

      projectedPercentage = Math.round((totalGradedObtained / allTotalMax) * 1000) / 10;
    } else {
      isTargetAchievable = (currentPercentage ?? 0) >= targetPercentage;
      requiredRemainingPercentage = null;
      projectedPercentage = currentPercentage;
    }
  }

  const gradeInfo = getGradeDetails(currentPercentage);

  return {
    subject,
    assessments: subjectAssessments,
    totalConfiguredWeight,
    gradedWeight,
    currentPercentage,
    projectedPercentage,
    targetPercentage,
    isTargetAchievable,
    requiredRemainingPercentage,
    letterGrade: gradeInfo.letter,
    gradePoints: gradeInfo.gpa
  };
}

/**
 * Calculate overall semester summary across all subjects
 */
export function calculateSemesterAcademicSummary(
  subjects: Subject[],
  assessments: Assessment[]
) {
  const subjectSummaries = subjects.map(s => calculateSubjectAcademicSummary(s, assessments));

  let totalCreditPoints = 0;
  let totalCredits = 0;
  let evaluatedSubjectsCount = 0;
  let percentageSum = 0;

  subjectSummaries.forEach(ss => {
    const credits = ss.subject.credits || 3;
    totalCredits += credits;

    if (ss.currentPercentage !== null) {
      evaluatedSubjectsCount++;
      percentageSum += ss.currentPercentage;
      totalCreditPoints += ss.gradePoints * credits;
    }
  });

  const overallSGPA = totalCredits > 0 && evaluatedSubjectsCount > 0
    ? Math.round((totalCreditPoints / (evaluatedSubjectsCount * (totalCredits / subjects.length || 3))) * 10) / 10
    : 0;

  const averagePercentage = evaluatedSubjectsCount > 0
    ? Math.round((percentageSum / evaluatedSubjectsCount) * 10) / 10
    : 0;

  // Identify strongest and weakest subject
  const evaluatedSummaries = subjectSummaries.filter(ss => ss.currentPercentage !== null);
  const sortedByPerf = [...evaluatedSummaries].sort((a, b) => (b.currentPercentage ?? 0) - (a.currentPercentage ?? 0));

  const strongestSubject = sortedByPerf[0] || null;
  const weakestSubject = sortedByPerf.length > 1 ? sortedByPerf[sortedByPerf.length - 1] : null;

  // Upcoming assessments (sorted by assessment date ascending)
  const upcomingAssessments = assessments
    .filter(a => a.status === 'upcoming')
    .sort((a, b) => new Date(a.assessmentDate).getTime() - new Date(b.assessmentDate).getTime());

  // Recent graded marks (sorted by assessment date descending)
  const recentGradedAssessments = assessments
    .filter(a => a.status === 'graded')
    .sort((a, b) => new Date(b.assessmentDate).getTime() - new Date(a.assessmentDate).getTime())
    .slice(0, 8);

  return {
    subjectSummaries,
    totalCredits,
    evaluatedSubjectsCount,
    averagePercentage,
    overallSGPA: Math.min(10.0, Math.max(0, overallSGPA || (averagePercentage / 10))),
    strongestSubject,
    weakestSubject,
    upcomingAssessments,
    recentGradedAssessments
  };
}
