import express from 'express';
import { calculateBubbleRiskIndex, getHistoricalBubbleComparisons } from '../services/bubbleRisk.js';
import { fetchBubbleIndicators } from '../services/macroData.js';

const router = express.Router();

// Get composite bubble risk index
router.get('/risk-index', async (req, res) => {
  try {
    const riskIndex = await calculateBubbleRiskIndex();
    res.json(riskIndex);
  } catch (error) {
    console.error('Error fetching bubble risk index:', error);
    res.status(500).json({ error: 'Failed to fetch bubble risk index' });
  }
});

// Get individual bubble indicators
router.get('/indicators', async (req, res) => {
  try {
    const indicators = await fetchBubbleIndicators();
    res.json(indicators);
  } catch (error) {
    console.error('Error fetching bubble indicators:', error);
    res.status(500).json({ error: 'Failed to fetch bubble indicators' });
  }
});

// Get historical bubble comparisons
router.get('/historical-comparisons', async (req, res) => {
  try {
    const indicators = await fetchBubbleIndicators();
    const comparisons = getHistoricalBubbleComparisons(indicators);
    res.json(comparisons);
  } catch (error) {
    console.error('Error fetching historical comparisons:', error);
    res.status(500).json({ error: 'Failed to fetch historical comparisons' });
  }
});

export default router;
