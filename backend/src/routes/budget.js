const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// Get all budget entries for current user
router.get('/', authenticateToken, async (req, res) => {
  try {
    const budgets = await prisma.budgetEntry.findMany({
      where: { studentId: req.user.id },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ budgets });
  } catch (error) {
    console.error('Error fetching budgets:', error);
    res.status(500).json({ error: 'Failed to fetch budget entries' });
  }
});

// Get single budget entry
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const budget = await prisma.budgetEntry.findUnique({
      where: { id }
    });

    if (!budget) {
      return res.status(404).json({ error: 'Budget entry not found' });
    }

    if (budget.studentId !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to view this budget' });
    }

    res.json({ budget });
  } catch (error) {
    console.error('Error fetching budget:', error);
    res.status(500).json({ error: 'Failed to fetch budget entry' });
  }
});

// Create new budget entry
router.post('/', authenticateToken, async (req, res) => {
  try {
    const {
      monthlyIncome,
      needs,
      wants,
      savings,
      allocations,
      notes,
      scenarioName,
      isHypothetical
    } = req.body;

    // Validate 50/20/30 rule calculations
    const totalAllocated = needs + wants + savings;
    if (Math.abs(totalAllocated - monthlyIncome) > 0.01) {
      return res.status(400).json({
        error: 'Budget must allocate all income',
        monthlyIncome,
        totalAllocated
      });
    }

    // Calculate recommended 50/20/30 allocation
    const recommended = {
      needs: monthlyIncome * 0.50,
      savings: monthlyIncome * 0.20,
      wants: monthlyIncome * 0.30
    };

    // Calculate variance from recommended allocation
    const variance = {
      needs: needs - recommended.needs,
      savings: savings - recommended.savings,
      wants: wants - recommended.wants
    };

    const budget = await prisma.budgetEntry.create({
      data: {
        studentId: req.user.id,
        monthlyIncome,
        needs,
        wants,
        savings,
        allocations: allocations || {},
        notes,
        scenarioName,
        isHypothetical: isHypothetical || false
      }
    });

    res.status(201).json({
      message: 'Budget created successfully',
      budget,
      recommended,
      variance,
      feedback: generateBudgetFeedback(variance, monthlyIncome)
    });
  } catch (error) {
    console.error('Error creating budget:', error);
    res.status(500).json({ error: 'Failed to create budget entry' });
  }
});

// Update budget entry
router.patch('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      monthlyIncome,
      needs,
      wants,
      savings,
      allocations,
      notes,
      scenarioName
    } = req.body;

    // Check ownership
    const existingBudget = await prisma.budgetEntry.findUnique({
      where: { id }
    });

    if (!existingBudget) {
      return res.status(404).json({ error: 'Budget entry not found' });
    }

    if (existingBudget.studentId !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to update this budget' });
    }

    // Validate allocation if provided
    if (monthlyIncome && needs && wants && savings) {
      const totalAllocated = needs + wants + savings;
      if (Math.abs(totalAllocated - monthlyIncome) > 0.01) {
        return res.status(400).json({
          error: 'Budget must allocate all income',
          monthlyIncome,
          totalAllocated
        });
      }
    }

    const updatedBudget = await prisma.budgetEntry.update({
      where: { id },
      data: {
        ...(monthlyIncome !== undefined && { monthlyIncome }),
        ...(needs !== undefined && { needs }),
        ...(wants !== undefined && { wants }),
        ...(savings !== undefined && { savings }),
        ...(allocations !== undefined && { allocations }),
        ...(notes !== undefined && { notes }),
        ...(scenarioName !== undefined && { scenarioName })
      }
    });

    res.json({
      message: 'Budget updated successfully',
      budget: updatedBudget
    });
  } catch (error) {
    console.error('Error updating budget:', error);
    res.status(500).json({ error: 'Failed to update budget entry' });
  }
});

// Delete budget entry
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const budget = await prisma.budgetEntry.findUnique({
      where: { id }
    });

    if (!budget) {
      return res.status(404).json({ error: 'Budget entry not found' });
    }

    if (budget.studentId !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to delete this budget' });
    }

    await prisma.budgetEntry.delete({
      where: { id }
    });

    res.json({ message: 'Budget entry deleted successfully' });
  } catch (error) {
    console.error('Error deleting budget:', error);
    res.status(500).json({ error: 'Failed to delete budget entry' });
  }
});

// Calculate 50/20/30 recommendation
router.post('/calculate', authenticateToken, async (req, res) => {
  try {
    const { monthlyIncome } = req.body;

    if (!monthlyIncome || monthlyIncome <= 0) {
      return res.status(400).json({ error: 'Valid monthly income required' });
    }

    const recommended = {
      needs: monthlyIncome * 0.50,
      savings: monthlyIncome * 0.20,
      wants: monthlyIncome * 0.30
    };

    res.json({
      monthlyIncome,
      recommended,
      percentages: {
        needs: 50,
        savings: 20,
        wants: 30
      }
    });
  } catch (error) {
    console.error('Error calculating budget:', error);
    res.status(500).json({ error: 'Failed to calculate budget' });
  }
});

// Helper function to generate feedback
function generateBudgetFeedback(variance, monthlyIncome) {
  const feedback = [];

  const needsPercentage = (variance.needs / monthlyIncome) * 100;
  const savingsPercentage = (variance.savings / monthlyIncome) * 100;
  const wantsPercentage = (variance.wants / monthlyIncome) * 100;

  if (Math.abs(needsPercentage) < 2 && Math.abs(savingsPercentage) < 2 && Math.abs(wantsPercentage) < 2) {
    feedback.push({
      type: 'success',
      message: 'Excellent! Your budget follows the 50/20/30 rule closely.'
    });
  }

  if (savingsPercentage < -5) {
    feedback.push({
      type: 'warning',
      category: 'savings',
      message: `You're saving ${Math.abs(savingsPercentage).toFixed(1)}% less than recommended. Consider increasing your savings to 20% of income.`
    });
  } else if (savingsPercentage > 5) {
    feedback.push({
      type: 'success',
      category: 'savings',
      message: `Great job! You're saving ${savingsPercentage.toFixed(1)}% more than the recommended 20%.`
    });
  }

  if (needsPercentage > 10) {
    feedback.push({
      type: 'warning',
      category: 'needs',
      message: `Your needs are ${needsPercentage.toFixed(1)}% higher than recommended. Look for ways to reduce essential expenses.`
    });
  }

  if (wantsPercentage > 10) {
    feedback.push({
      type: 'info',
      category: 'wants',
      message: `Your wants are ${wantsPercentage.toFixed(1)}% higher than recommended. Consider cutting back on discretionary spending.`
    });
  }

  return feedback;
}

module.exports = router;
