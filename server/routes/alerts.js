import express from 'express';
import { query } from '../db/connection.js';

const router = express.Router();

// Get all active alerts
router.get('/', async (req, res) => {
  try {
    const { severity, limit = 50 } = req.query;
    
    let queryText = 'SELECT a.*, c.symbol, c.name FROM alerts a LEFT JOIN companies c ON a.company_id = c.id WHERE a.is_active = true';
    const params = [];
    
    if (severity) {
      queryText += ' AND a.severity = $1';
      params.push(severity);
    }
    
    queryText += ' ORDER BY a.date DESC LIMIT $' + (params.length + 1);
    params.push(parseInt(limit));
    
    const result = await query(queryText, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching alerts:', error);
    res.status(500).json({ error: 'Failed to fetch alerts' });
  }
});

// Create new alert
router.post('/', async (req, res) => {
  try {
    const { severity, category, message, companyId } = req.body;
    
    const result = await query(
      'INSERT INTO alerts (severity, category, message, company_id) VALUES ($1, $2, $3, $4) RETURNING *',
      [severity, category, message, companyId || null]
    );
    
    // Emit WebSocket event
    const io = req.app.get('io');
    io.emit('alert', result.rows[0]);
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error creating alert:', error);
    res.status(500).json({ error: 'Failed to create alert' });
  }
});

// Mark alert as resolved
router.patch('/:id/resolve', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await query(
      'UPDATE alerts SET is_active = false, resolved_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Alert not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error resolving alert:', error);
    res.status(500).json({ error: 'Failed to resolve alert' });
  }
});

// Delete alert
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await query('DELETE FROM alerts WHERE id = $1 RETURNING *', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Alert not found' });
    }
    
    res.json({ message: 'Alert deleted successfully' });
  } catch (error) {
    console.error('Error deleting alert:', error);
    res.status(500).json({ error: 'Failed to delete alert' });
  }
});

export default router;
