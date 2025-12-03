import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await login(email, password);

    if (result.success) {
      navigate('/dashboard');
    } else {
      setError(result.error);
    }
    setLoading(false);
  };

  const demoAccounts = [
    { email: 'teacher@wealthbuilder.com', password: 'teacher123', role: 'Teacher' },
    { email: 'student1@wealthbuilder.com', password: 'student123', role: 'Student' },
  ];

  const loginWithDemo = async (email, password) => {
    setEmail(email);
    setPassword(password);
    setError('');
    setLoading(true);

    const result = await login(email, password);

    if (result.success) {
      navigate('/dashboard');
    } else {
      setError(result.error);
    }
    setLoading(false);
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.header}>
          <h1 style={styles.title}>9 Dimes Project</h1>
          <h2 style={styles.subtitle}>Wealth Builder</h2>
          <p style={styles.tagline}>Financial Literacy for the Next Generation</p>
        </div>

        <form onSubmit={handleSubmit} style={styles.form}>
          <h3 style={styles.formTitle}>Login</h3>

          {error && (
            <div style={styles.error}>{error}</div>
          )}

          <div style={styles.inputGroup}>
            <label style={styles.label}>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={styles.input}
              placeholder="Enter your email"
              required
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Password</label>
            <div style={styles.passwordContainer}>
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{...styles.input, paddingRight: '45px'}}
                placeholder="Enter your password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={styles.passwordToggle}
              >
                {showPassword ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{...styles.button, ...(loading ? styles.buttonDisabled : {})}}
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>

          <p style={styles.linkText}>
            Don't have an account? <Link to="/register" style={styles.link}>Register</Link>
          </p>
        </form>

        <div style={styles.demoSection}>
          <p style={styles.demoTitle}>Quick Demo Login:</p>
          {demoAccounts.map((account, index) => (
            <button
              key={index}
              onClick={() => loginWithDemo(account.email, account.password)}
              style={styles.demoButton}
              disabled={loading}
            >
              Login as {account.role}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    padding: '20px',
  },
  card: {
    background: 'white',
    borderRadius: '12px',
    boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
    maxWidth: '450px',
    width: '100%',
    padding: '40px',
  },
  header: {
    textAlign: 'center',
    marginBottom: '30px',
  },
  title: {
    fontSize: '32px',
    fontWeight: 'bold',
    color: '#667eea',
    margin: '0 0 8px 0',
  },
  subtitle: {
    fontSize: '24px',
    fontWeight: '600',
    color: '#764ba2',
    margin: '0 0 8px 0',
  },
  tagline: {
    fontSize: '14px',
    color: '#666',
    margin: 0,
  },
  form: {
    marginBottom: '30px',
  },
  formTitle: {
    fontSize: '20px',
    marginBottom: '20px',
    color: '#333',
  },
  error: {
    background: '#fee',
    border: '1px solid #fcc',
    color: '#c33',
    padding: '12px',
    borderRadius: '6px',
    marginBottom: '16px',
    fontSize: '14px',
  },
  inputGroup: {
    marginBottom: '20px',
  },
  label: {
    display: 'block',
    marginBottom: '8px',
    color: '#333',
    fontWeight: '500',
  },
  passwordContainer: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },
  input: {
    width: '100%',
    padding: '12px',
    border: '2px solid #ddd',
    borderRadius: '6px',
    fontSize: '16px',
    boxSizing: 'border-box',
    transition: 'border-color 0.2s',
  },
  passwordToggle: {
    position: 'absolute',
    right: '10px',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: '20px',
    padding: '5px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  button: {
    width: '100%',
    padding: '14px',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'transform 0.2s',
  },
  buttonDisabled: {
    opacity: 0.6,
    cursor: 'not-allowed',
  },
  linkText: {
    textAlign: 'center',
    marginTop: '16px',
    color: '#666',
    fontSize: '14px',
  },
  link: {
    color: '#667eea',
    textDecoration: 'none',
    fontWeight: '600',
  },
  demoSection: {
    borderTop: '2px solid #eee',
    paddingTop: '20px',
  },
  demoTitle: {
    fontSize: '14px',
    color: '#666',
    marginBottom: '12px',
    textAlign: 'center',
  },
  demoButton: {
    width: '100%',
    padding: '10px',
    background: '#f7f7f7',
    border: '2px solid #ddd',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    marginBottom: '8px',
    transition: 'all 0.2s',
  },
};
