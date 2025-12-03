import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { budgetAPI } from '../services/api';

export default function BudgetCalculator() {
  const navigate = useNavigate();
  const [monthlyIncome, setMonthlyIncome] = useState('');
  const [budget, setBudget] = useState(null);
  const [saving, setSaving] = useState(false);

  const calculate = () => {
    const income = parseFloat(monthlyIncome);
    if (isNaN(income) || income <= 0) {
      alert('Please enter a valid monthly income');
      return;
    }

    setBudget({
      income: income,
      needs: income * 0.50,
      wants: income * 0.30,
      savings: income * 0.20
    });
  };

  const saveBudget = async () => {
    if (!budget) return;

    setSaving(true);
    try {
      await budgetAPI.create({
        month: new Date(),
        income: budget.income,
        needs: budget.needs,
        wants: budget.wants,
        savingsInvestments: budget.savings,
        notes: '50/30/20 budget calculation'
      });
      alert('Budget saved successfully!');
      navigate('/dashboard');
    } catch (error) {
      console.error('Failed to save budget:', error);
      alert('Failed to save budget');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <button onClick={() => navigate('/dashboard')} style={styles.backButton}>
          ← Back to Dashboard
        </button>
        <h1 style={styles.title}>Budget Calculator</h1>
        <p style={styles.subtitle}>50/30/20 Rule</p>
      </header>

      <div style={styles.content}>
        <div style={styles.card}>
          <div style={styles.info}>
            <h2 style={styles.infoTitle}>What is the 50/30/20 Rule?</h2>
            <p style={styles.infoPara}>
              The 50/30/20 rule is a simple budgeting method that divides your after-tax income into three categories:
            </p>
            <ul style={styles.infoList}>
              <li><strong>50% for Needs:</strong> Essential expenses like rent, utilities, groceries, and transportation</li>
              <li><strong>30% for Wants:</strong> Non-essential spending like entertainment, dining out, and hobbies</li>
              <li><strong>20% for Savings:</strong> Emergency fund, retirement, debt repayment, and investments</li>
            </ul>
          </div>

          <div style={styles.calculator}>
            <label style={styles.label}>Enter Your Monthly Income (After Tax)</label>
            <div style={styles.inputGroup}>
              <span style={styles.dollarSign}>$</span>
              <input
                type="number"
                value={monthlyIncome}
                onChange={(e) => setMonthlyIncome(e.target.value)}
                style={styles.input}
                placeholder="0"
                min="0"
                step="0.01"
              />
            </div>
            <button onClick={calculate} style={styles.calculateButton}>
              Calculate Budget
            </button>
          </div>

          {budget && (
            <div style={styles.results}>
              <h3 style={styles.resultsTitle}>Your Budget Breakdown</h3>

              <div style={styles.resultItem}>
                <div style={styles.resultHeader}>
                  <span style={styles.resultLabel}>Needs (50%)</span>
                  <span style={styles.resultAmount}>${budget.needs.toFixed(2)}</span>
                </div>
                <div style={styles.progressBar}>
                  <div style={{...styles.progressFill, width: '50%', background: '#ef4444'}}></div>
                </div>
                <p style={styles.resultDesc}>Rent, utilities, groceries, insurance, minimum debt payments</p>
              </div>

              <div style={styles.resultItem}>
                <div style={styles.resultHeader}>
                  <span style={styles.resultLabel}>Wants (30%)</span>
                  <span style={styles.resultAmount}>${budget.wants.toFixed(2)}</span>
                </div>
                <div style={styles.progressBar}>
                  <div style={{...styles.progressFill, width: '30%', background: '#f59e0b'}}></div>
                </div>
                <p style={styles.resultDesc}>Entertainment, dining out, subscriptions, hobbies</p>
              </div>

              <div style={styles.resultItem}>
                <div style={styles.resultHeader}>
                  <span style={styles.resultLabel}>Savings (20%)</span>
                  <span style={styles.resultAmount}>${budget.savings.toFixed(2)}</span>
                </div>
                <div style={styles.progressBar}>
                  <div style={{...styles.progressFill, width: '20%', background: '#10b981'}}></div>
                </div>
                <p style={styles.resultDesc}>Emergency fund, retirement, investments, extra debt payments</p>
              </div>

              <div style={styles.summary}>
                <div style={styles.summaryRow}>
                  <span>Monthly Income:</span>
                  <strong>${budget.income.toFixed(2)}</strong>
                </div>
                <div style={styles.summaryRow}>
                  <span>Total Allocated:</span>
                  <strong>${(budget.needs + budget.wants + budget.savings).toFixed(2)}</strong>
                </div>
              </div>

              <button onClick={saveBudget} disabled={saving} style={styles.saveButton}>
                {saving ? 'Saving...' : 'Save Budget'}
              </button>
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
    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
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
    maxWidth: '900px',
    margin: '0 auto',
    padding: '32px',
  },
  card: {
    background: 'white',
    borderRadius: '12px',
    padding: '32px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  },
  info: {
    marginBottom: '32px',
    padding: '24px',
    background: '#f9fafb',
    borderRadius: '8px',
  },
  infoTitle: {
    margin: '0 0 16px 0',
    fontSize: '20px',
    color: '#111',
  },
  infoPara: {
    marginBottom: '16px',
    lineHeight: '1.6',
    color: '#555',
  },
  infoList: {
    margin: 0,
    paddingLeft: '20px',
    lineHeight: '2',
    color: '#555',
  },
  calculator: {
    marginBottom: '32px',
  },
  label: {
    display: 'block',
    marginBottom: '12px',
    fontSize: '16px',
    fontWeight: '600',
    color: '#333',
  },
  inputGroup: {
    position: 'relative',
    marginBottom: '16px',
  },
  dollarSign: {
    position: 'absolute',
    left: '16px',
    top: '50%',
    transform: 'translateY(-50%)',
    fontSize: '20px',
    fontWeight: '600',
    color: '#666',
  },
  input: {
    width: '100%',
    padding: '16px 16px 16px 40px',
    fontSize: '20px',
    border: '2px solid #ddd',
    borderRadius: '8px',
    boxSizing: 'border-box',
  },
  calculateButton: {
    width: '100%',
    padding: '16px',
    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '18px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  results: {
    marginTop: '32px',
  },
  resultsTitle: {
    margin: '0 0 24px 0',
    fontSize: '24px',
    color: '#111',
    textAlign: 'center',
  },
  resultItem: {
    marginBottom: '24px',
    padding: '20px',
    background: '#f9fafb',
    borderRadius: '8px',
  },
  resultHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px',
  },
  resultLabel: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#333',
  },
  resultAmount: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#10b981',
  },
  progressBar: {
    height: '12px',
    background: '#e5e7eb',
    borderRadius: '6px',
    overflow: 'hidden',
    marginBottom: '8px',
  },
  progressFill: {
    height: '100%',
    transition: 'width 0.5s ease',
  },
  resultDesc: {
    margin: 0,
    fontSize: '14px',
    color: '#666',
  },
  summary: {
    marginTop: '32px',
    padding: '20px',
    background: '#eff6ff',
    borderRadius: '8px',
    border: '2px solid #3b82f6',
  },
  summaryRow: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '8px',
    fontSize: '16px',
    color: '#333',
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
};
