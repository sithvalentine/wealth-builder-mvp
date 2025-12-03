import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { dashboardAPI } from '../services/api';

export default function StudentDashboard() {
  const { user, logout } = useAuth();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const response = await dashboardAPI.getStudentDashboard();
      setDashboardData(response.data);
    } catch (err) {
      setError('Failed to load dashboard data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loading}>Loading your dashboard...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.container}>
        <div style={styles.error}>{error}</div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Header */}
      <header style={styles.header}>
        <div>
          <h1 style={styles.brandTitle}>9 Dimes Project Wealth Builder</h1>
          <p style={styles.welcome}>Welcome back, {user?.firstName}!</p>
        </div>
        <button onClick={logout} style={styles.logoutButton}>
          Logout
        </button>
      </header>

      {/* Main Content */}
      <div style={styles.content}>
        {/* Classes Section */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>My Classes</h2>
          {dashboardData?.classes && dashboardData.classes.length > 0 ? (
            <div style={styles.grid}>
              {dashboardData.classes.map((classItem) => (
                <div key={classItem.classId} style={styles.classCard}>
                  <h3 style={styles.className}>{classItem.className}</h3>
                  <p style={styles.courseName}>{classItem.courseName}</p>
                  <div style={styles.instructor}>
                    Instructor: {classItem.instructor.firstName} {classItem.instructor.lastName}
                  </div>

                  <div style={styles.progressSection}>
                    <div style={styles.gradeDisplay}>
                      <span style={styles.gradeLabel}>Current Grade:</span>
                      <span style={{...styles.grade, color: getGradeColor(classItem.currentGrade)}}>
                        {classItem.currentGrade}% ({classItem.letterGrade})
                      </span>
                    </div>

                    <div style={styles.progressBar}>
                      <div style={styles.progressLabel}>
                        Lessons: {classItem.completedLessons} / {classItem.totalLessons}
                      </div>
                      <div style={styles.progressBarTrack}>
                        <div
                          style={{
                            ...styles.progressBarFill,
                            width: `${classItem.progressPercentage}%`
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  <div style={styles.categoryGrades}>
                    {Object.entries(classItem.gradesByCategory).map(([category, scores]) => (
                      <div key={category} style={styles.categoryItem}>
                        <span>{category}:</span>
                        <span>
                          {scores.possible > 0
                            ? `${((scores.earned / scores.possible) * 100).toFixed(1)}%`
                            : 'N/A'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={styles.emptyState}>
              <p>You're not enrolled in any classes yet.</p>
              <p style={styles.enrollCode}>Use enrollment code: <strong>FINLIT2024</strong></p>
            </div>
          )}
        </section>

        {/* Recent Quizzes */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Recent Quizzes</h2>
          {dashboardData?.recentQuizzes && dashboardData.recentQuizzes.length > 0 ? (
            <div style={styles.quizList}>
              {dashboardData.recentQuizzes.map((quiz, index) => (
                <div key={index} style={styles.quizItem}>
                  <div>
                    <div style={styles.quizTitle}>{quiz.quizTitle}</div>
                    <div style={styles.quizDate}>
                      {new Date(quiz.submittedAt).toLocaleDateString()}
                    </div>
                  </div>
                  <div style={styles.quizScore}>
                    <span style={{color: getGradeColor(quiz.score)}}>{quiz.score.toFixed(1)}%</span>
                    <span style={styles.quizPoints}>
                      {quiz.earnedPoints}/{quiz.possiblePoints}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={styles.emptyState}>No quizzes taken yet.</div>
          )}
        </section>

        {/* Wealth Tracker Summary */}
        {dashboardData?.wealthTracker && (
          <section style={styles.section}>
            <h2 style={styles.sectionTitle}>Wealth Tracker</h2>
            <div style={styles.wealthCard}>
              <div style={styles.wealthItem}>
                <span>Net Worth:</span>
                <span style={styles.wealthValue}>
                  ${dashboardData.wealthTracker.netWorth.toLocaleString()}
                </span>
              </div>
              <div style={styles.wealthItem}>
                <span>Total Assets:</span>
                <span>${dashboardData.wealthTracker.totalAssets.toLocaleString()}</span>
              </div>
              <div style={styles.wealthItem}>
                <span>Total Liabilities:</span>
                <span>${dashboardData.wealthTracker.totalLiabilities.toLocaleString()}</span>
              </div>
              <div style={styles.updateDate}>
                Last updated: {new Date(dashboardData.wealthTracker.lastUpdated).toLocaleDateString()}
              </div>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

function getGradeColor(grade) {
  if (grade >= 90) return '#10b981';
  if (grade >= 80) return '#3b82f6';
  if (grade >= 70) return '#f59e0b';
  if (grade >= 60) return '#ef4444';
  return '#991b1b';
}

const styles = {
  container: {
    minHeight: '100vh',
    background: '#f3f4f6',
  },
  header: {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    padding: '24px 32px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
  },
  brandTitle: {
    margin: 0,
    fontSize: '24px',
    fontWeight: 'bold',
  },
  welcome: {
    margin: '8px 0 0 0',
    opacity: 0.9,
    fontSize: '16px',
  },
  logoutButton: {
    padding: '10px 20px',
    background: 'rgba(255,255,255,0.2)',
    border: '2px solid white',
    borderRadius: '6px',
    color: 'white',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  content: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '32px',
  },
  section: {
    background: 'white',
    borderRadius: '12px',
    padding: '24px',
    marginBottom: '24px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  },
  sectionTitle: {
    margin: '0 0 20px 0',
    fontSize: '20px',
    color: '#111',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
    gap: '20px',
  },
  classCard: {
    border: '2px solid #e5e7eb',
    borderRadius: '8px',
    padding: '20px',
    background: '#fafafa',
  },
  className: {
    margin: '0 0 8px 0',
    fontSize: '18px',
    color: '#667eea',
  },
  courseName: {
    margin: '0 0 8px 0',
    color: '#666',
    fontSize: '14px',
  },
  instructor: {
    fontSize: '13px',
    color: '#888',
    marginBottom: '16px',
  },
  progressSection: {
    marginTop: '16px',
  },
  gradeDisplay: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px',
    padding: '12px',
    background: 'white',
    borderRadius: '6px',
  },
  gradeLabel: {
    fontWeight: '600',
    color: '#333',
  },
  grade: {
    fontSize: '20px',
    fontWeight: 'bold',
  },
  progressBar: {
    marginTop: '12px',
  },
  progressLabel: {
    fontSize: '13px',
    color: '#666',
    marginBottom: '6px',
  },
  progressBarTrack: {
    height: '8px',
    background: '#e5e7eb',
    borderRadius: '4px',
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)',
    transition: 'width 0.3s ease',
  },
  categoryGrades: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '8px',
    marginTop: '16px',
    padding: '12px',
    background: 'white',
    borderRadius: '6px',
  },
  categoryItem: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '13px',
    color: '#666',
  },
  quizList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  quizItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px',
    background: '#fafafa',
    borderRadius: '8px',
    border: '1px solid #e5e7eb',
  },
  quizTitle: {
    fontWeight: '600',
    color: '#333',
    marginBottom: '4px',
  },
  quizDate: {
    fontSize: '13px',
    color: '#888',
  },
  quizScore: {
    textAlign: 'right',
  },
  quizPoints: {
    display: 'block',
    fontSize: '12px',
    color: '#888',
    marginTop: '4px',
  },
  wealthCard: {
    padding: '16px',
    background: '#fafafa',
    borderRadius: '8px',
    border: '1px solid #e5e7eb',
  },
  wealthItem: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '12px 0',
    borderBottom: '1px solid #e5e7eb',
  },
  wealthValue: {
    fontWeight: 'bold',
    color: '#10b981',
    fontSize: '18px',
  },
  updateDate: {
    marginTop: '12px',
    fontSize: '12px',
    color: '#888',
    textAlign: 'center',
  },
  emptyState: {
    padding: '40px',
    textAlign: 'center',
    color: '#888',
  },
  enrollCode: {
    marginTop: '8px',
    color: '#667eea',
  },
  loading: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    fontSize: '18px',
    color: '#666',
  },
  error: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    fontSize: '18px',
    color: '#ef4444',
  },
};
