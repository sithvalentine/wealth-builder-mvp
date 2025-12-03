import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { dashboardAPI } from '../services/api';

export default function TeacherDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const response = await dashboardAPI.getTeacherDashboard();
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
          <p style={styles.welcome}>Welcome, {user?.firstName} {user?.lastName}</p>
          <p style={styles.role}>{user?.role}</p>
        </div>
        <button onClick={logout} style={styles.logoutButton}>
          Logout
        </button>
      </header>

      {/* Main Content */}
      <div style={styles.content}>
        {/* Quick Actions */}
        <div style={styles.actionsBar}>
          <button onClick={() => navigate('/classes')} style={styles.actionButton}>
            Manage Classes
          </button>
        </div>

        {/* Summary Stats */}
        <div style={styles.statsGrid}>
          <div style={styles.statCard}>
            <div style={styles.statNumber}>{dashboardData?.classes.length || 0}</div>
            <div style={styles.statLabel}>Active Classes</div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statNumber}>{dashboardData?.totalStudents || 0}</div>
            <div style={styles.statLabel}>Total Students</div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statNumber}>{dashboardData?.recentActivity.length || 0}</div>
            <div style={styles.statLabel}>Recent Activities</div>
          </div>
        </div>

        {/* Classes Section */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>My Classes</h2>
          {dashboardData?.classes && dashboardData.classes.length > 0 ? (
            <div style={styles.grid}>
              {dashboardData.classes.map((classItem) => (
                <div key={classItem.classId} style={styles.classCard}>
                  <div style={styles.classHeader}>
                    <div>
                      <h3 style={styles.className}>{classItem.className}</h3>
                      <p style={styles.courseName}>{classItem.courseName}</p>
                    </div>
                    <div style={styles.badge}>{classItem.contextType}</div>
                  </div>

                  <div style={styles.classStats}>
                    <div style={styles.classStat}>
                      <span style={styles.classStatLabel}>Students:</span>
                      <span style={styles.classStatValue}>{classItem.studentCount}</span>
                    </div>
                    <div style={styles.classStat}>
                      <span style={styles.classStatLabel}>Avg Grade:</span>
                      <span style={{...styles.classStatValue, color: getGradeColor(classItem.averageGrade)}}>
                        {classItem.averageGrade}%
                      </span>
                    </div>
                  </div>

                  <div style={styles.classInfo}>
                    <div style={styles.infoItem}>
                      <strong>Start:</strong> {new Date(classItem.startDate).toLocaleDateString()}
                    </div>
                    <div style={styles.infoItem}>
                      <strong>End:</strong> {new Date(classItem.endDate).toLocaleDateString()}
                    </div>
                    <div style={styles.infoItem}>
                      <strong>Code:</strong> <span style={styles.enrollCode}>{classItem.enrollmentCode}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={styles.emptyState}>
              <p>No classes created yet.</p>
            </div>
          )}
        </section>

        {/* Recent Activity */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Recent Student Activity</h2>
          {dashboardData?.recentActivity && dashboardData.recentActivity.length > 0 ? (
            <div style={styles.activityList}>
              {dashboardData.recentActivity.slice(0, 10).map((activity, index) => (
                <div key={index} style={styles.activityItem}>
                  <div style={styles.activityInfo}>
                    <div style={styles.activityStudent}>{activity.studentName}</div>
                    <div style={styles.activityDetails}>
                      {activity.className} • {activity.category}: {activity.itemTitle}
                    </div>
                    <div style={styles.activityDate}>
                      {new Date(activity.submittedAt).toLocaleString()}
                    </div>
                  </div>
                  <div style={styles.activityScore}>
                    <div style={{color: getGradeColor(activity.percentage)}}>
                      {activity.percentage.toFixed(1)}%
                    </div>
                    <div style={styles.activityPoints}>
                      {activity.earnedPoints}/{activity.possiblePoints}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={styles.emptyState}>No recent activity.</div>
          )}
        </section>
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
    background: 'linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)',
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
    margin: '8px 0 4px 0',
    opacity: 0.9,
    fontSize: '16px',
  },
  role: {
    margin: 0,
    opacity: 0.8,
    fontSize: '14px',
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
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '20px',
    marginBottom: '32px',
  },
  statCard: {
    background: 'white',
    padding: '24px',
    borderRadius: '12px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    textAlign: 'center',
  },
  statNumber: {
    fontSize: '36px',
    fontWeight: 'bold',
    color: '#ef4444',
    marginBottom: '8px',
  },
  statLabel: {
    fontSize: '14px',
    color: '#666',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
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
  classHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '16px',
  },
  className: {
    margin: '0 0 8px 0',
    fontSize: '18px',
    color: '#ef4444',
  },
  courseName: {
    margin: 0,
    color: '#666',
    fontSize: '14px',
  },
  badge: {
    padding: '4px 12px',
    background: '#f59e0b',
    color: 'white',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: '600',
  },
  classStats: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '12px',
    marginBottom: '16px',
    padding: '12px',
    background: 'white',
    borderRadius: '6px',
  },
  classStat: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  classStatLabel: {
    fontSize: '12px',
    color: '#888',
    textTransform: 'uppercase',
  },
  classStatValue: {
    fontSize: '20px',
    fontWeight: 'bold',
    color: '#333',
  },
  classInfo: {
    padding: '12px',
    background: 'white',
    borderRadius: '6px',
  },
  infoItem: {
    fontSize: '13px',
    color: '#666',
    marginBottom: '6px',
  },
  enrollCode: {
    fontFamily: 'monospace',
    background: '#fef3c7',
    padding: '2px 8px',
    borderRadius: '4px',
    color: '#92400e',
    fontWeight: '600',
  },
  activityList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  activityItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px',
    background: '#fafafa',
    borderRadius: '8px',
    border: '1px solid #e5e7eb',
  },
  activityInfo: {
    flex: 1,
  },
  activityStudent: {
    fontWeight: '600',
    color: '#333',
    marginBottom: '4px',
  },
  activityDetails: {
    fontSize: '13px',
    color: '#666',
    marginBottom: '4px',
  },
  activityDate: {
    fontSize: '12px',
    color: '#888',
  },
  activityScore: {
    textAlign: 'right',
    marginLeft: '16px',
  },
  activityPoints: {
    fontSize: '12px',
    color: '#888',
    marginTop: '4px',
  },
  emptyState: {
    padding: '40px',
    textAlign: 'center',
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
  error: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    fontSize: '18px',
    color: '#ef4444',
  },
  actionsBar: {
    marginBottom: '24px',
  },
  actionButton: {
    padding: '12px 24px',
    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
  },
};
