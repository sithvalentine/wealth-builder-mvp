const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// Get all wealth tracker entries for current user
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const where = {
      studentId: req.user.id,
      ...(startDate && endDate && {
        date: {
          gte: new Date(startDate),
          lte: new Date(endDate)
        }
      })
    };

    const entries = await prisma.wealthTrackerEntry.findMany({
      where,
      orderBy: { date: 'asc' }
    });

    // Calculate summary statistics
    const summary = calculateWealthSummary(entries);

    res.json({
      entries,
      summary
    });
  } catch (error) {
    console.error('Error fetching wealth tracker entries:', error);
    res.status(500).json({ error: 'Failed to fetch wealth tracker entries' });
  }
});

// Get single wealth tracker entry
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const entry = await prisma.wealthTrackerEntry.findUnique({
      where: { id }
    });

    if (!entry) {
      return res.status(404).json({ error: 'Wealth tracker entry not found' });
    }

    if (entry.studentId !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to view this entry' });
    }

    res.json({ entry });
  } catch (error) {
    console.error('Error fetching wealth tracker entry:', error);
    res.status(500).json({ error: 'Failed to fetch wealth tracker entry' });
  }
});

// Create new wealth tracker entry
router.post('/', authenticateToken, async (req, res) => {
  try {
    const {
      date,
      cashSavings,
      checkingAccount,
      investments,
      retirement,
      realEstate,
      otherAssets,
      creditCardDebt,
      studentLoans,
      carLoan,
      otherDebts,
      notes,
      isHypothetical
    } = req.body;

    // Calculate totals
    const totalAssets = (cashSavings || 0) + (checkingAccount || 0) + (investments || 0) +
                       (retirement || 0) + (realEstate || 0) + (otherAssets || 0);

    const totalLiabilities = (creditCardDebt || 0) + (studentLoans || 0) +
                            (carLoan || 0) + (otherDebts || 0);

    const netWorth = totalAssets - totalLiabilities;

    const entry = await prisma.wealthTrackerEntry.create({
      data: {
        studentId: req.user.id,
        date: date ? new Date(date) : new Date(),
        cashSavings: cashSavings || 0,
        checkingAccount: checkingAccount || 0,
        investments: investments || 0,
        retirement: retirement || 0,
        realEstate: realEstate || 0,
        otherAssets: otherAssets || 0,
        creditCardDebt: creditCardDebt || 0,
        studentLoans: studentLoans || 0,
        carLoan: carLoan || 0,
        otherDebts: otherDebts || 0,
        totalAssets,
        totalLiabilities,
        netWorth,
        notes,
        isHypothetical: isHypothetical || false
      }
    });

    // Get previous entry to calculate growth
    const previousEntry = await prisma.wealthTrackerEntry.findFirst({
      where: {
        studentId: req.user.id,
        date: { lt: entry.date }
      },
      orderBy: { date: 'desc' }
    });

    let growth = null;
    if (previousEntry) {
      growth = {
        netWorthChange: netWorth - previousEntry.netWorth,
        percentageChange: previousEntry.netWorth !== 0
          ? ((netWorth - previousEntry.netWorth) / Math.abs(previousEntry.netWorth)) * 100
          : null,
        daysElapsed: Math.floor((entry.date - previousEntry.date) / (1000 * 60 * 60 * 24))
      };
    }

    res.status(201).json({
      message: 'Wealth tracker entry created successfully',
      entry,
      growth
    });
  } catch (error) {
    console.error('Error creating wealth tracker entry:', error);
    res.status(500).json({ error: 'Failed to create wealth tracker entry' });
  }
});

// Update wealth tracker entry
router.patch('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Check ownership
    const existingEntry = await prisma.wealthTrackerEntry.findUnique({
      where: { id }
    });

    if (!existingEntry) {
      return res.status(404).json({ error: 'Wealth tracker entry not found' });
    }

    if (existingEntry.studentId !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to update this entry' });
    }

    const {
      date,
      cashSavings,
      checkingAccount,
      investments,
      retirement,
      realEstate,
      otherAssets,
      creditCardDebt,
      studentLoans,
      carLoan,
      otherDebts,
      notes
    } = req.body;

    // Prepare update data with current values as defaults
    const updateData = {
      cashSavings: cashSavings !== undefined ? cashSavings : existingEntry.cashSavings,
      checkingAccount: checkingAccount !== undefined ? checkingAccount : existingEntry.checkingAccount,
      investments: investments !== undefined ? investments : existingEntry.investments,
      retirement: retirement !== undefined ? retirement : existingEntry.retirement,
      realEstate: realEstate !== undefined ? realEstate : existingEntry.realEstate,
      otherAssets: otherAssets !== undefined ? otherAssets : existingEntry.otherAssets,
      creditCardDebt: creditCardDebt !== undefined ? creditCardDebt : existingEntry.creditCardDebt,
      studentLoans: studentLoans !== undefined ? studentLoans : existingEntry.studentLoans,
      carLoan: carLoan !== undefined ? carLoan : existingEntry.carLoan,
      otherDebts: otherDebts !== undefined ? otherDebts : existingEntry.otherDebts,
      ...(date && { date: new Date(date) }),
      ...(notes !== undefined && { notes })
    };

    // Recalculate totals
    updateData.totalAssets = updateData.cashSavings + updateData.checkingAccount +
                            updateData.investments + updateData.retirement +
                            updateData.realEstate + updateData.otherAssets;

    updateData.totalLiabilities = updateData.creditCardDebt + updateData.studentLoans +
                                 updateData.carLoan + updateData.otherDebts;

    updateData.netWorth = updateData.totalAssets - updateData.totalLiabilities;

    const updatedEntry = await prisma.wealthTrackerEntry.update({
      where: { id },
      data: updateData
    });

    res.json({
      message: 'Wealth tracker entry updated successfully',
      entry: updatedEntry
    });
  } catch (error) {
    console.error('Error updating wealth tracker entry:', error);
    res.status(500).json({ error: 'Failed to update wealth tracker entry' });
  }
});

// Delete wealth tracker entry
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const entry = await prisma.wealthTrackerEntry.findUnique({
      where: { id }
    });

    if (!entry) {
      return res.status(404).json({ error: 'Wealth tracker entry not found' });
    }

    if (entry.studentId !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to delete this entry' });
    }

    await prisma.wealthTrackerEntry.delete({
      where: { id }
    });

    res.json({ message: 'Wealth tracker entry deleted successfully' });
  } catch (error) {
    console.error('Error deleting wealth tracker entry:', error);
    res.status(500).json({ error: 'Failed to delete wealth tracker entry' });
  }
});

// Get wealth growth analytics
router.get('/analytics/growth', authenticateToken, async (req, res) => {
  try {
    const entries = await prisma.wealthTrackerEntry.findMany({
      where: {
        studentId: req.user.id,
        isHypothetical: false
      },
      orderBy: { date: 'asc' }
    });

    if (entries.length === 0) {
      return res.json({
        message: 'No wealth tracker data available',
        analytics: null
      });
    }

    const analytics = {
      totalEntries: entries.length,
      firstEntry: entries[0],
      latestEntry: entries[entries.length - 1],
      totalGrowth: entries[entries.length - 1].netWorth - entries[0].netWorth,
      percentageGrowth: entries[0].netWorth !== 0
        ? ((entries[entries.length - 1].netWorth - entries[0].netWorth) / Math.abs(entries[0].netWorth)) * 100
        : null,
      averageNetWorth: entries.reduce((sum, e) => sum + e.netWorth, 0) / entries.length,
      highestNetWorth: Math.max(...entries.map(e => e.netWorth)),
      lowestNetWorth: Math.min(...entries.map(e => e.netWorth)),
      assetBreakdown: {
        cashSavings: entries[entries.length - 1].cashSavings,
        checkingAccount: entries[entries.length - 1].checkingAccount,
        investments: entries[entries.length - 1].investments,
        retirement: entries[entries.length - 1].retirement,
        realEstate: entries[entries.length - 1].realEstate,
        otherAssets: entries[entries.length - 1].otherAssets
      },
      liabilityBreakdown: {
        creditCardDebt: entries[entries.length - 1].creditCardDebt,
        studentLoans: entries[entries.length - 1].studentLoans,
        carLoan: entries[entries.length - 1].carLoan,
        otherDebts: entries[entries.length - 1].otherDebts
      }
    };

    res.json({ analytics });
  } catch (error) {
    console.error('Error fetching wealth analytics:', error);
    res.status(500).json({ error: 'Failed to fetch wealth analytics' });
  }
});

// Helper function to calculate summary
function calculateWealthSummary(entries) {
  if (entries.length === 0) {
    return {
      totalEntries: 0,
      currentNetWorth: 0,
      totalChange: 0,
      percentageChange: 0
    };
  }

  const latest = entries[entries.length - 1];
  const first = entries[0];

  return {
    totalEntries: entries.length,
    currentNetWorth: latest.netWorth,
    currentAssets: latest.totalAssets,
    currentLiabilities: latest.totalLiabilities,
    totalChange: latest.netWorth - first.netWorth,
    percentageChange: first.netWorth !== 0
      ? ((latest.netWorth - first.netWorth) / Math.abs(first.netWorth)) * 100
      : null,
    averageNetWorth: entries.reduce((sum, e) => sum + e.netWorth, 0) / entries.length
  };
}

module.exports = router;
