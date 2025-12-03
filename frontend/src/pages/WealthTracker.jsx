import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { wealthAPI } from '../services/api';

export default function WealthTracker() {
  const navigate = useNavigate();
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Current entry form state
  const [checking, setChecking] = useState('');
  const [savings, setSavings] = useState('');
  const [investments, setInvestments] = useState('');
  const [creditCard, setCreditCard] = useState('');
  const [loans, setLoans] = useState('');
  const [otherAssets, setOtherAssets] = useState('');
  const [otherLiabilities, setOtherLiabilities] = useState('');

  useEffect(() => {
    loadEntries();
  }, []);

  const loadEntries = async () => {
    try {
      const response = await wealthAPI.getAll();
      setEntries(response.data || []);
    } catch (err) {
      console.error('Failed to load wealth tracker entries:', err);
    } finally {
      setLoading(false);
    }
  };

  const calculateNetWorth = () => {
    const totalAssets =
      parseFloat(checking || 0) +
      parseFloat(savings || 0) +
      parseFloat(investments || 0) +
      parseFloat(otherAssets || 0);

    const totalLiabilities =
      parseFloat(creditCard || 0) +
      parseFloat(loans || 0) +
      parseFloat(otherLiabilities || 0);

    return {
      totalAssets,
      totalLiabilities,
      netWorth: totalAssets - totalLiabilities
    };
  };

  const handleSave = async () => {
    const { totalAssets, totalLiabilities, netWorth } = calculateNetWorth();

    if (totalAssets === 0 && totalLiabilities === 0) {
      alert('Please enter at least one asset or liability');
      return;
    }

    setSaving(true);
    try {
      await wealthAPI.create({
        date: new Date(),
        checking: parseFloat(checking || 0),
        savings: parseFloat(savings || 0),
        investments: parseFloat(investments || 0),
        creditCard: parseFloat(creditCard || 0),
        loans: parseFloat(loans || 0),
        otherAssets: parseFloat(otherAssets || 0),
        otherLiabilities: parseFloat(otherLiabilities || 0),
        totalAssets,
        totalLiabilities,
        netWorth,
        notes: ''
      });

      alert('Wealth tracker entry saved successfully!');

      // Reset form
      setChecking('');
      setSavings('');
      setInvestments('');
      setCreditCard('');
      setLoans('');
      setOtherAssets('');
      setOtherLiabilities('');

      // Reload entries
      await loadEntries();
    } catch (error) {
      console.error('Failed to save entry:', error);
      alert('Failed to save entry');
    } finally {
      setSaving(false);
    }
  };

  const currentCalc = calculateNetWorth();

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loading}>Loading wealth tracker...</div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <button onClick={() => navigate('/dashboard')} style={styles.backButton}>
          ← Back to Dashboard
        </button>
        <h1 style={styles.title}>Wealth Tracker</h1>
        <p style={styles.subtitle}>Track your net worth over time</p>
      </header>

      <div style={styles.content}>
        <div style={styles.formCard}>
          <h2 style={styles.sectionTitle}>Add New Entry</h2>

          {/* Assets Section */}
          <div style={styles.section}>
            <h3 style={styles.subsectionTitle}>Assets (What You Own)</h3>

            <div style={styles.inputRow}>
              <label style={styles.label}>Checking Account</label>
              <div style={styles.inputGroup}>
                <span style={styles.dollarSign}>$</span>
                <input
                  type="number"
                  value={checking}
                  onChange={(e) => setChecking(e.target.value)}
                  style={styles.input}
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                />
              </div>
            </div>

            <div style={styles.inputRow}>
              <label style={styles.label}>Savings Account</label>
              <div style={styles.inputGroup}>
                <span style={styles.dollarSign}>$</span>
                <input
                  type="number"
                  value={savings}
                  onChange={(e) => setSavings(e.target.value)}
                  style={styles.input}
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                />
              </div>
            </div>

            <div style={styles.inputRow}>
              <label style={styles.label}>Investments</label>
              <div style={styles.inputGroup}>
                <span style={styles.dollarSign}>$</span>
                <input
                  type="number"
                  value={investments}
                  onChange={(e) => setInvestments(e.target.value)}
                  style={styles.input}
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                />
              </div>
            </div>

            <div style={styles.inputRow}>
              <label style={styles.label}>Other Assets</label>
              <div style={styles.inputGroup}>
                <span style={styles.dollarSign}>$</span>
                <input
                  type="number"
                  value={otherAssets}
                  onChange={(e) => setOtherAssets(e.target.value)}
                  style={styles.input}
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                />
              </div>
            </div>
          </div>

          {/* Liabilities Section */}
          <div style={styles.section}>
            <h3 style={styles.subsectionTitle}>Liabilities (What You Owe)</h3>

            <div style={styles.inputRow}>
              <label style={styles.label}>Credit Card Debt</label>
              <div style={styles.inputGroup}>
                <span style={styles.dollarSign}>$</span>
                <input
                  type="number"
                  value={creditCard}
                  onChange={(e) => setCreditCard(e.target.value)}
                  style={styles.input}
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                />
              </div>
            </div>

            <div style={styles.inputRow}>
              <label style={styles.label}>Loans (Student, Auto, etc.)</label>
              <div style={styles.inputGroup}>
                <span style={styles.dollarSign}>$</span>
                <input
                  type="number"
                  value={loans}
                  onChange={(e) => setLoans(e.target.value)}
                  style={styles.input}
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                />
              </div>
            </div>

            <div style={styles.inputRow}>
              <label style={styles.label}>Other Liabilities</label>
              <div style={styles.inputGroup}>
                <span style={styles.dollarSign}>$</span>
                <input
                  type="number"
                  value={otherLiabilities}
                  onChange={(e) => setOtherLiabilities(e.target.value)}
                  style={styles.input}
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                />
              </div>
            </div>
          </div>

          {/* Summary */}
          <div style={styles.summary}>
            <h3 style={styles.summaryTitle}>Current Calculation</h3>
            <div style={styles.summaryRow}>
              <span>Total Assets:</span>
              <strong style={{color: '#10b981'}}>${currentCalc.totalAssets.toFixed(2)}</strong>
            </div>
            <div style={styles.summaryRow}>
              <span>Total Liabilities:</span>
              <strong style={{color: '#ef4444'}}>${currentCalc.totalLiabilities.toFixed(2)}</strong>
            </div>
            <div style={{...styles.summaryRow, ...styles.netWorthRow}}>
              <span>Net Worth:</span>
              <strong style={{
                color: currentCalc.netWorth >= 0 ? '#10b981' : '#ef4444',
                fontSize: '24px'
              }}>
                ${currentCalc.netWorth.toFixed(2)}
              </strong>
            </div>
          </div>

          <button onClick={handleSave} disabled={saving} style={styles.saveButton}>
            {saving ? 'Saving...' : 'Save Entry'}
          </button>
        </div>

        {/* History */}
        {entries.length > 0 && (
          <div style={styles.historyCard}>
            <h2 style={styles.sectionTitle}>Net Worth History</h2>
            <div style={styles.historyList}>
              {entries
                .sort((a, b) => new Date(b.date) - new Date(a.date))
                .map((entry) => (
                  <div key={entry.id} style={styles.historyItem}>
                    <div style={styles.historyDate}>
                      {new Date(entry.date).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </div>
                    <div style={styles.historyDetails}>
                      <div style={styles.historyRow}>
                        <span>Assets:</span>
                        <span style={{color: '#10b981'}}>${entry.totalAssets.toFixed(2)}</span>
                      </div>
                      <div style={styles.historyRow}>
                        <span>Liabilities:</span>
                        <span style={{color: '#ef4444'}}>${entry.totalLiabilities.toFixed(2)}</span>
                      </div>
                      <div style={{...styles.historyRow, fontWeight: 'bold'}}>
                        <span>Net Worth:</span>
                        <span style={{
                          color: entry.netWorth >= 0 ? '#10b981' : '#ef4444',
                          fontSize: '18px'
                        }}>
                          ${entry.netWorth.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}
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
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))',
    gap: '24px',
  },
  formCard: {
    background: 'white',
    borderRadius: '12px',
    padding: '32px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  },
  historyCard: {
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
  section: {
    marginBottom: '32px',
  },
  subsectionTitle: {
    margin: '0 0 16px 0',
    fontSize: '18px',
    color: '#667eea',
    fontWeight: '600',
  },
  inputRow: {
    marginBottom: '16px',
  },
  label: {
    display: 'block',
    marginBottom: '8px',
    fontSize: '14px',
    fontWeight: '600',
    color: '#333',
  },
  inputGroup: {
    position: 'relative',
  },
  dollarSign: {
    position: 'absolute',
    left: '12px',
    top: '50%',
    transform: 'translateY(-50%)',
    fontSize: '16px',
    fontWeight: '600',
    color: '#666',
  },
  input: {
    width: '100%',
    padding: '12px 12px 12px 32px',
    fontSize: '16px',
    border: '2px solid #ddd',
    borderRadius: '6px',
    boxSizing: 'border-box',
  },
  summary: {
    marginTop: '32px',
    padding: '24px',
    background: '#f9fafb',
    borderRadius: '8px',
    border: '2px solid #667eea',
  },
  summaryTitle: {
    margin: '0 0 16px 0',
    fontSize: '18px',
    color: '#111',
  },
  summaryRow: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '12px',
    fontSize: '16px',
    color: '#333',
  },
  netWorthRow: {
    paddingTop: '12px',
    borderTop: '2px solid #ddd',
    marginTop: '12px',
  },
  saveButton: {
    width: '100%',
    marginTop: '24px',
    padding: '16px',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '18px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  historyList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  historyItem: {
    padding: '20px',
    background: '#fafafa',
    borderRadius: '8px',
    border: '1px solid #e5e7eb',
  },
  historyDate: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#667eea',
    marginBottom: '12px',
  },
  historyDetails: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  historyRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '14px',
    color: '#333',
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
