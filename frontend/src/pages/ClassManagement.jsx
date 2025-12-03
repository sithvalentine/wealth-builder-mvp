import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { classesAPI, coursesAPI } from '../services/api';

export default function ClassManagement() {
  const navigate = useNavigate();
  const [classes, setClasses] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [creating, setCreating] = useState(false);

  // Form state
  const [className, setClassName] = useState('');
  const [courseId, setCourseId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [contextType, setContextType] = useState('Classroom');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [classesRes, coursesRes] = await Promise.all([
        classesAPI.getAll(),
        coursesAPI.getAll()
      ]);
      setClasses(classesRes.data || []);
      setCourses(coursesRes.data || []);
    } catch (err) {
      console.error('Failed to load data:', err);
    } finally {
      setLoading(false);
    }
  };

  const generateEnrollmentCode = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  };

  const handleCreateClass = async (e) => {
    e.preventDefault();

    if (!className || !courseId || !startDate || !endDate) {
      alert('Please fill in all required fields');
      return;
    }

    setCreating(true);
    try {
      const enrollmentCode = generateEnrollmentCode();

      await classesAPI.create({
        name: className,
        courseId,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        contextType,
        enrollmentCode
      });

      alert(`Class created successfully! Enrollment code: ${enrollmentCode}`);

      // Reset form
      setClassName('');
      setCourseId('');
      setStartDate('');
      setEndDate('');
      setContextType('Classroom');
      setShowCreateForm(false);

      // Reload classes
      await loadData();
    } catch (error) {
      console.error('Failed to create class:', error);
      alert('Failed to create class');
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loading}>Loading class management...</div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <button onClick={() => navigate('/dashboard')} style={styles.backButton}>
          ← Back to Dashboard
        </button>
        <h1 style={styles.title}>Class Management</h1>
        <p style={styles.subtitle}>Create and manage your classes</p>
      </header>

      <div style={styles.content}>
        {/* Create Class Button */}
        <div style={styles.createSection}>
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            style={styles.createButton}
          >
            {showCreateForm ? 'Cancel' : '+ Create New Class'}
          </button>
        </div>

        {/* Create Class Form */}
        {showCreateForm && (
          <div style={styles.formCard}>
            <h2 style={styles.formTitle}>Create New Class</h2>
            <form onSubmit={handleCreateClass}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Class Name *</label>
                <input
                  type="text"
                  value={className}
                  onChange={(e) => setClassName(e.target.value)}
                  style={styles.input}
                  placeholder="e.g., Financial Literacy - Period 1"
                  required
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Course *</label>
                <select
                  value={courseId}
                  onChange={(e) => setCourseId(e.target.value)}
                  style={styles.select}
                  required
                >
                  <option value="">Select a course...</option>
                  {courses.map((course) => (
                    <option key={course.id} value={course.id}>
                      {course.title}
                    </option>
                  ))}
                </select>
              </div>

              <div style={styles.formRow}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Start Date *</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    style={styles.input}
                    required
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>End Date *</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    style={styles.input}
                    required
                  />
                </div>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Context Type</label>
                <select
                  value={contextType}
                  onChange={(e) => setContextType(e.target.value)}
                  style={styles.select}
                >
                  <option value="Classroom">Classroom</option>
                  <option value="AfterSchool">After School</option>
                  <option value="Community">Community</option>
                </select>
              </div>

              <button type="submit" disabled={creating} style={styles.submitButton}>
                {creating ? 'Creating...' : 'Create Class'}
              </button>
            </form>
          </div>
        )}

        {/* Classes List */}
        <div style={styles.classesSection}>
          <h2 style={styles.sectionTitle}>Your Classes ({classes.length})</h2>

          {classes.length === 0 ? (
            <div style={styles.emptyState}>
              <p>No classes created yet.</p>
              <p>Click "Create New Class" to get started.</p>
            </div>
          ) : (
            <div style={styles.classesGrid}>
              {classes.map((classItem) => (
                <div key={classItem.id} style={styles.classCard}>
                  <div style={styles.classCardHeader}>
                    <div>
                      <h3 style={styles.classCardTitle}>{classItem.name}</h3>
                      <p style={styles.classCardCourse}>
                        {courses.find(c => c.id === classItem.courseId)?.title || 'Course'}
                      </p>
                    </div>
                    <div style={styles.contextBadge}>
                      {classItem.contextType}
                    </div>
                  </div>

                  <div style={styles.classCardDetails}>
                    <div style={styles.detailRow}>
                      <span style={styles.detailLabel}>Enrollment Code:</span>
                      <span style={styles.enrollmentCode}>{classItem.enrollmentCode}</span>
                    </div>
                    <div style={styles.detailRow}>
                      <span style={styles.detailLabel}>Start Date:</span>
                      <span>{new Date(classItem.startDate).toLocaleDateString()}</span>
                    </div>
                    <div style={styles.detailRow}>
                      <span style={styles.detailLabel}>End Date:</span>
                      <span>{new Date(classItem.endDate).toLocaleDateString()}</span>
                    </div>
                    <div style={styles.detailRow}>
                      <span style={styles.detailLabel}>Status:</span>
                      <span style={{
                        ...styles.statusBadge,
                        background: new Date(classItem.endDate) > new Date() ? '#d1fae5' : '#fee2e2',
                        color: new Date(classItem.endDate) > new Date() ? '#065f46' : '#991b1b'
                      }}>
                        {new Date(classItem.endDate) > new Date() ? 'Active' : 'Ended'}
                      </span>
                    </div>
                  </div>

                  <div style={styles.classCardActions}>
                    <button
                      onClick={() => navigate(`/lessons/${classItem.id}`)}
                      style={styles.viewButton}
                    >
                      View Content
                    </button>
                  </div>
                </div>
              ))}
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
    background: 'linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)',
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
    fontSize: '18px',
    opacity: 0.9,
  },
  content: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '32px',
  },
  createSection: {
    marginBottom: '24px',
  },
  createButton: {
    padding: '12px 24px',
    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  formCard: {
    background: 'white',
    borderRadius: '12px',
    padding: '32px',
    marginBottom: '32px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  },
  formTitle: {
    margin: '0 0 24px 0',
    fontSize: '24px',
    color: '#111',
  },
  formGroup: {
    marginBottom: '20px',
  },
  formRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '20px',
  },
  label: {
    display: 'block',
    marginBottom: '8px',
    fontSize: '14px',
    fontWeight: '600',
    color: '#333',
  },
  input: {
    width: '100%',
    padding: '12px',
    fontSize: '16px',
    border: '2px solid #ddd',
    borderRadius: '6px',
    boxSizing: 'border-box',
  },
  select: {
    width: '100%',
    padding: '12px',
    fontSize: '16px',
    border: '2px solid #ddd',
    borderRadius: '6px',
    boxSizing: 'border-box',
    background: 'white',
  },
  submitButton: {
    width: '100%',
    marginTop: '24px',
    padding: '14px',
    background: 'linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  classesSection: {
    background: 'white',
    borderRadius: '12px',
    padding: '32px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  },
  sectionTitle: {
    margin: '0 0 24px 0',
    fontSize: '24px',
    color: '#111',
  },
  classesGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
    gap: '20px',
  },
  classCard: {
    background: '#fafafa',
    border: '2px solid #e5e7eb',
    borderRadius: '8px',
    padding: '20px',
  },
  classCardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '16px',
  },
  classCardTitle: {
    margin: '0 0 8px 0',
    fontSize: '18px',
    color: '#111',
    fontWeight: '600',
  },
  classCardCourse: {
    margin: 0,
    fontSize: '14px',
    color: '#666',
  },
  contextBadge: {
    padding: '4px 12px',
    background: '#fef3c7',
    color: '#92400e',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: '600',
  },
  classCardDetails: {
    padding: '16px',
    background: 'white',
    borderRadius: '6px',
    marginBottom: '16px',
  },
  detailRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '10px',
    fontSize: '14px',
  },
  detailLabel: {
    color: '#666',
    fontWeight: '500',
  },
  enrollmentCode: {
    fontFamily: 'monospace',
    background: '#eff6ff',
    padding: '4px 8px',
    borderRadius: '4px',
    color: '#1e40af',
    fontWeight: '600',
    fontSize: '14px',
  },
  statusBadge: {
    padding: '4px 12px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: '600',
  },
  classCardActions: {
    display: 'flex',
    gap: '12px',
  },
  viewButton: {
    flex: 1,
    padding: '10px',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  emptyState: {
    textAlign: 'center',
    padding: '60px 20px',
    color: '#888',
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
