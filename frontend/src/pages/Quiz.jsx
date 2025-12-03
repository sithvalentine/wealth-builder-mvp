import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { quizAPI } from '../services/api';

export default function Quiz() {
  const { lessonId } = useParams();
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState(null);
  const [attemptId, setAttemptId] = useState(null);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    loadQuiz();
  }, [lessonId]);

  const loadQuiz = async () => {
    try {
      // For this MVP, we'll use the lessonId as the quizId
      // In a real app, you'd fetch the quiz associated with the lesson
      const response = await quizAPI.getById(lessonId);
      setQuiz(response.data.quiz);
    } catch (err) {
      setError('Failed to load quiz. This lesson may not have a quiz yet.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const startQuiz = async () => {
    try {
      // Get the first class the student is enrolled in
      // In a real app, you'd get this from context or the lesson
      const classGroupId = localStorage.getItem('currentClassId') || 'default-class-id';

      const response = await quizAPI.start(lessonId, classGroupId);
      setAttemptId(response.data.attemptId);
    } catch (err) {
      setError('Failed to start quiz');
      console.error(err);
    }
  };

  const handleAnswerChange = (questionId, answer) => {
    setAnswers({
      ...answers,
      [questionId]: answer
    });
  };

  const handleMultiSelectChange = (questionId, option) => {
    const currentAnswers = answers[questionId] || [];
    const newAnswers = currentAnswers.includes(option)
      ? currentAnswers.filter(a => a !== option)
      : [...currentAnswers, option];

    setAnswers({
      ...answers,
      [questionId]: newAnswers
    });
  };

  const handleSubmit = async () => {
    if (!attemptId) {
      await startQuiz();
      return;
    }

    // Check if all questions are answered
    const unanswered = quiz.questions.filter(q => !answers[q.id] || (Array.isArray(answers[q.id]) && answers[q.id].length === 0));
    if (unanswered.length > 0) {
      if (!window.confirm(`You have ${unanswered.length} unanswered question(s). Submit anyway?`)) {
        return;
      }
    }

    setSubmitting(true);
    try {
      const classGroupId = localStorage.getItem('currentClassId') || 'default-class-id';
      const response = await quizAPI.submit(lessonId, attemptId, answers, classGroupId);
      setResult(response.data);
    } catch (err) {
      setError('Failed to submit quiz');
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loading}>Loading quiz...</div>
      </div>
    );
  }

  if (error && !quiz) {
    return (
      <div style={styles.container}>
        <header style={styles.header}>
          <button onClick={() => navigate(-1)} style={styles.backButton}>
            ← Back
          </button>
          <h1 style={styles.title}>Quiz</h1>
        </header>
        <div style={styles.content}>
          <div style={styles.errorCard}>
            <p>{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (result) {
    return (
      <div style={styles.container}>
        <header style={styles.header}>
          <button onClick={() => navigate('/dashboard')} style={styles.backButton}>
            ← Back to Dashboard
          </button>
          <h1 style={styles.title}>Quiz Results</h1>
        </header>

        <div style={styles.content}>
          <div style={styles.resultCard}>
            <div style={styles.scoreCircle}>
              <div style={{
                ...styles.scoreNumber,
                color: getScoreColor(result.score)
              }}>
                {result.score.toFixed(1)}%
              </div>
              <div style={styles.scoreLabel}>Your Score</div>
            </div>

            <div style={styles.resultSummary}>
              <div style={styles.resultItem}>
                <span>Points Earned:</span>
                <strong>{result.earnedPoints} / {result.possiblePoints}</strong>
              </div>
              <div style={styles.resultItem}>
                <span>Attempt Number:</span>
                <strong>#{result.attemptNumber}</strong>
              </div>
            </div>

            <h3 style={styles.reviewTitle}>Answer Review</h3>
            {quiz.questions.map((question, index) => {
              const graded = result.gradedAnswers[question.id];
              return (
                <div key={question.id} style={styles.reviewQuestion}>
                  <div style={styles.reviewHeader}>
                    <span style={styles.questionNumber}>Question {index + 1}</span>
                    <span style={{
                      ...styles.reviewBadge,
                      background: graded.isCorrect ? '#d1fae5' : '#fee2e2',
                      color: graded.isCorrect ? '#065f46' : '#991b1b'
                    }}>
                      {graded.isCorrect ? 'Correct' : 'Incorrect'}
                    </span>
                  </div>
                  <p style={styles.questionText}>{question.questionText}</p>
                  <div style={styles.answerInfo}>
                    <div>
                      <strong>Your answer:</strong>{' '}
                      {Array.isArray(graded.studentAnswer)
                        ? graded.studentAnswer.join(', ')
                        : graded.studentAnswer || 'No answer'}
                    </div>
                    {!graded.isCorrect && (
                      <div style={{color: '#10b981', marginTop: '4px'}}>
                        <strong>Correct answer:</strong>{' '}
                        {Array.isArray(graded.correctAnswer)
                          ? graded.correctAnswer.join(', ')
                          : graded.correctAnswer}
                      </div>
                    )}
                  </div>
                  <div style={styles.pointsInfo}>
                    Points: {graded.pointsEarned} / {graded.possiblePoints}
                  </div>
                </div>
              );
            })}

            <button onClick={() => navigate('/dashboard')} style={styles.doneButton}>
              Done
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <button onClick={() => navigate(-1)} style={styles.backButton}>
          ← Back
        </button>
        <h1 style={styles.title}>{quiz.title}</h1>
        {quiz.description && <p style={styles.subtitle}>{quiz.description}</p>}
      </header>

      <div style={styles.content}>
        <div style={styles.quizCard}>
          {!attemptId ? (
            <div style={styles.startSection}>
              <div style={styles.quizInfo}>
                <div style={styles.infoItem}>
                  <strong>Questions:</strong> {quiz.questions?.length || 0}
                </div>
                <div style={styles.infoItem}>
                  <strong>Total Points:</strong> {quiz.totalPoints}
                </div>
                {quiz.timeLimit && (
                  <div style={styles.infoItem}>
                    <strong>Time Limit:</strong> {quiz.timeLimit} minutes
                  </div>
                )}
              </div>
              <button onClick={startQuiz} style={styles.startButton}>
                Start Quiz
              </button>
            </div>
          ) : (
            <>
              {quiz.questions?.map((question, index) => (
                <div key={question.id} style={styles.question}>
                  <div style={styles.questionHeader}>
                    <span style={styles.questionNumber}>Question {index + 1}</span>
                    <span style={styles.points}>{question.points} points</span>
                  </div>
                  <p style={styles.questionText}>{question.questionText}</p>

                  {question.questionType === 'MultipleChoice' && (
                    <div style={styles.options}>
                      {question.options.map((option) => (
                        <label key={option} style={styles.optionLabel}>
                          <input
                            type="radio"
                            name={`question-${question.id}`}
                            value={option}
                            checked={answers[question.id] === option}
                            onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                            style={styles.radio}
                          />
                          <span>{option}</span>
                        </label>
                      ))}
                    </div>
                  )}

                  {question.questionType === 'TrueFalse' && (
                    <div style={styles.options}>
                      <label style={styles.optionLabel}>
                        <input
                          type="radio"
                          name={`question-${question.id}`}
                          value="True"
                          checked={answers[question.id] === 'True'}
                          onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                          style={styles.radio}
                        />
                        <span>True</span>
                      </label>
                      <label style={styles.optionLabel}>
                        <input
                          type="radio"
                          name={`question-${question.id}`}
                          value="False"
                          checked={answers[question.id] === 'False'}
                          onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                          style={styles.radio}
                        />
                        <span>False</span>
                      </label>
                    </div>
                  )}

                  {question.questionType === 'MultipleSelect' && (
                    <div style={styles.options}>
                      <p style={styles.multiSelectNote}>Select all that apply:</p>
                      {question.options.map((option) => (
                        <label key={option} style={styles.optionLabel}>
                          <input
                            type="checkbox"
                            value={option}
                            checked={(answers[question.id] || []).includes(option)}
                            onChange={() => handleMultiSelectChange(question.id, option)}
                            style={styles.checkbox}
                          />
                          <span>{option}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              ))}

              <button
                onClick={handleSubmit}
                disabled={submitting}
                style={styles.submitButton}
              >
                {submitting ? 'Submitting...' : 'Submit Quiz'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function getScoreColor(score) {
  if (score >= 90) return '#10b981';
  if (score >= 80) return '#3b82f6';
  if (score >= 70) return '#f59e0b';
  if (score >= 60) return '#ef4444';
  return '#991b1b';
}

const styles = {
  container: {
    minHeight: '100vh',
    background: '#f3f4f6',
  },
  header: {
    background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
    color: 'white',
    padding: '24px 32px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
  },
  backButton: {
    background: 'rgba(255,255,255,0.2)',
    border: '2px solid white',
    borderRadius: '6px',
    color: 'white',
    padding: '8px 16px',
    cursor: 'pointer',
    marginBottom: '12px',
  },
  title: {
    margin: '0 0 8px 0',
    fontSize: '32px',
    fontWeight: 'bold',
  },
  subtitle: {
    margin: 0,
    fontSize: '16px',
    opacity: 0.9,
  },
  content: {
    maxWidth: '900px',
    margin: '0 auto',
    padding: '32px',
  },
  quizCard: {
    background: 'white',
    borderRadius: '12px',
    padding: '32px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  },
  startSection: {
    textAlign: 'center',
    padding: '32px',
  },
  quizInfo: {
    display: 'flex',
    justifyContent: 'center',
    gap: '32px',
    marginBottom: '32px',
    padding: '24px',
    background: '#f9fafb',
    borderRadius: '8px',
  },
  infoItem: {
    fontSize: '16px',
    color: '#333',
  },
  startButton: {
    padding: '16px 48px',
    background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '18px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  question: {
    marginBottom: '32px',
    padding: '24px',
    background: '#fafafa',
    borderRadius: '8px',
    border: '1px solid #e5e7eb',
  },
  questionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px',
  },
  questionNumber: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#3b82f6',
  },
  points: {
    fontSize: '13px',
    color: '#666',
    background: '#e0e7ff',
    padding: '4px 12px',
    borderRadius: '12px',
  },
  questionText: {
    fontSize: '18px',
    color: '#111',
    marginBottom: '16px',
    lineHeight: '1.6',
  },
  options: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  optionLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px',
    background: 'white',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '16px',
    border: '2px solid transparent',
    transition: 'all 0.2s',
  },
  radio: {
    width: '20px',
    height: '20px',
    cursor: 'pointer',
  },
  checkbox: {
    width: '20px',
    height: '20px',
    cursor: 'pointer',
  },
  multiSelectNote: {
    fontSize: '14px',
    color: '#666',
    fontStyle: 'italic',
    margin: '0 0 8px 0',
  },
  submitButton: {
    width: '100%',
    padding: '16px',
    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '18px',
    fontWeight: '600',
    cursor: 'pointer',
    marginTop: '24px',
  },
  resultCard: {
    background: 'white',
    borderRadius: '12px',
    padding: '40px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  },
  scoreCircle: {
    textAlign: 'center',
    padding: '40px',
    background: '#f9fafb',
    borderRadius: '12px',
    marginBottom: '32px',
  },
  scoreNumber: {
    fontSize: '64px',
    fontWeight: 'bold',
    marginBottom: '8px',
  },
  scoreLabel: {
    fontSize: '18px',
    color: '#666',
  },
  resultSummary: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '16px',
    marginBottom: '32px',
    padding: '20px',
    background: '#f9fafb',
    borderRadius: '8px',
  },
  resultItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    fontSize: '14px',
    color: '#666',
  },
  reviewTitle: {
    margin: '32px 0 20px 0',
    fontSize: '24px',
    color: '#111',
  },
  reviewQuestion: {
    marginBottom: '20px',
    padding: '20px',
    background: '#fafafa',
    borderRadius: '8px',
    border: '1px solid #e5e7eb',
  },
  reviewHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px',
  },
  reviewBadge: {
    padding: '4px 12px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: '600',
  },
  answerInfo: {
    fontSize: '14px',
    color: '#333',
    marginTop: '12px',
    padding: '12px',
    background: 'white',
    borderRadius: '6px',
  },
  pointsInfo: {
    marginTop: '8px',
    fontSize: '13px',
    color: '#666',
    fontWeight: '600',
  },
  doneButton: {
    width: '100%',
    marginTop: '32px',
    padding: '16px',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '18px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  errorCard: {
    background: 'white',
    borderRadius: '12px',
    padding: '40px',
    textAlign: 'center',
    color: '#ef4444',
    fontSize: '18px',
  },
  loading: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    fontSize: '18px',
    color: '#666',
  },
};
