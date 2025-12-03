import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { coursesAPI, lessonsAPI } from '../services/api';

export default function LessonsView() {
  const { classId } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [selectedLesson, setSelectedLesson] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadCourseContent();
  }, [classId]);

  const loadCourseContent = async () => {
    try {
      // For now, load the first course - later we'll get the course from the class
      const response = await coursesAPI.getAll();
      if (response.data && response.data.length > 0) {
        setCourse(response.data[0]);
      }
    } catch (err) {
      setError('Failed to load course content');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const selectLesson = async (lessonId) => {
    try {
      const response = await lessonsAPI.getById(lessonId);
      setSelectedLesson(response.data);
    } catch (err) {
      console.error('Failed to load lesson:', err);
    }
  };

  if (loading) {
    return <div style={styles.loading}>Loading course content...</div>;
  }

  if (error) {
    return <div style={styles.error}>{error}</div>;
  }

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <button onClick={() => navigate('/dashboard')} style={styles.backButton}>
          ← Back to Dashboard
        </button>
        <h1 style={styles.title}>
          {course?.title || 'Course Content'}
        </h1>
      </header>

      <div style={styles.content}>
        <div style={styles.sidebar}>
          <h2 style={styles.sidebarTitle}>Course Outline</h2>
          {course?.units?.map((unit) => (
            <div key={unit.id} style={styles.unit}>
              <div style={styles.unitHeader}>
                <span style={styles.unitNumber}>Unit {unit.unitNumber}</span>
                <h3 style={styles.unitTitle}>{unit.title}</h3>
              </div>
              {unit.weeks?.map((week) => (
                <div key={week.id} style={styles.week}>
                  <div style={styles.weekTitle}>Week {week.weekNumber}: {week.title}</div>
                  {week.lessons?.map((lesson) => (
                    <div
                      key={lesson.id}
                      style={{
                        ...styles.lesson,
                        ...(selectedLesson?.id === lesson.id ? styles.lessonActive : {})
                      }}
                      onClick={() => selectLesson(lesson.id)}
                    >
                      {lesson.title}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          ))}
        </div>

        <div style={styles.main}>
          {selectedLesson ? (
            <div style={styles.lessonContent}>
              <h1 style={styles.lessonTitle}>{selectedLesson.title}</h1>
              <div style={styles.lessonMeta}>
                <span>Duration: {selectedLesson.estimatedDuration} minutes</span>
                {selectedLesson.isRequired && <span style={styles.requiredBadge}>Required</span>}
              </div>
              
              <div style={styles.objectives}>
                <h3>Learning Objectives</h3>
                <ul>
                  {selectedLesson.learningObjectives?.map((obj, i) => (
                    <li key={i}>{obj}</li>
                  ))}
                </ul>
              </div>

              <div style={styles.lessonBody}>
                <div dangerouslySetInnerHTML={{ __html: selectedLesson.content || '<p>Content will be added soon.</p>' }} />
              </div>

              {selectedLesson.hasQuiz && (
                <div style={styles.quizSection}>
                  <h3>Quiz Available</h3>
                  <button style={styles.quizButton} onClick={() => navigate(`/quiz/${selectedLesson.id}`)}>
                    Take Quiz
                  </button>
                </div>
              )}

              <button style={styles.completeButton}>
                Mark as Complete
              </button>
            </div>
          ) : (
            <div style={styles.emptyState}>
              <p>Select a lesson from the sidebar to begin</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
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
    margin: 0,
    fontSize: '24px',
    fontWeight: 'bold',
  },
  content: {
    display: 'flex',
    maxWidth: '1400px',
    margin: '0 auto',
    minHeight: 'calc(100vh - 120px)',
  },
  sidebar: {
    width: '320px',
    background: 'white',
    borderRight: '1px solid #e5e7eb',
    padding: '24px',
    overflowY: 'auto',
  },
  sidebarTitle: {
    margin: '0 0 20px 0',
    fontSize: '18px',
    color: '#111',
  },
  unit: {
    marginBottom: '24px',
  },
  unitHeader: {
    marginBottom: '12px',
  },
  unitNumber: {
    display: 'inline-block',
    background: '#667eea',
    color: 'white',
    padding: '4px 12px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: '600',
    marginBottom: '8px',
  },
  unitTitle: {
    margin: '8px 0 0 0',
    fontSize: '16px',
    color: '#333',
  },
  week: {
    marginLeft: '12px',
    marginBottom: '16px',
  },
  weekTitle: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#666',
    marginBottom: '8px',
  },
  lesson: {
    padding: '10px 12px',
    fontSize: '14px',
    color: '#555',
    cursor: 'pointer',
    borderRadius: '6px',
    marginBottom: '4px',
    transition: 'all 0.2s',
  },
  lessonActive: {
    background: '#ede9fe',
    color: '#667eea',
    fontWeight: '600',
  },
  main: {
    flex: 1,
    padding: '32px',
    overflowY: 'auto',
  },
  lessonContent: {
    background: 'white',
    borderRadius: '12px',
    padding: '32px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  },
  lessonTitle: {
    margin: '0 0 16px 0',
    fontSize: '32px',
    color: '#111',
  },
  lessonMeta: {
    display: 'flex',
    gap: '16px',
    fontSize: '14px',
    color: '#666',
    marginBottom: '24px',
    paddingBottom: '16px',
    borderBottom: '1px solid #e5e7eb',
  },
  requiredBadge: {
    background: '#fef3c7',
    color: '#92400e',
    padding: '2px 12px',
    borderRadius: '12px',
    fontWeight: '600',
  },
  objectives: {
    background: '#f9fafb',
    padding: '20px',
    borderRadius: '8px',
    marginBottom: '24px',
  },
  lessonBody: {
    lineHeight: '1.8',
    fontSize: '16px',
    color: '#333',
  },
  quizSection: {
    marginTop: '32px',
    padding: '20px',
    background: '#eff6ff',
    borderRadius: '8px',
    border: '2px solid #3b82f6',
  },
  quizButton: {
    marginTop: '12px',
    padding: '12px 24px',
    background: '#3b82f6',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  completeButton: {
    marginTop: '24px',
    width: '100%',
    padding: '14px',
    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  emptyState: {
    background: 'white',
    borderRadius: '12px',
    padding: '64px 32px',
    textAlign: 'center',
    color: '#888',
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
  error: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    fontSize: '18px',
    color: '#ef4444',
  },
};
