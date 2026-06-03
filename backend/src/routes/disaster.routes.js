import { Router } from 'express';
import { db } from '../models/db.js';

const router = Router();

// GET /api/disasters — all disaster records
router.get('/', (req, res) => {
  const disasters = db.disasters.getAll();
  res.json({ success: true, data: disasters, total: disasters.length });
});

// GET /api/disasters/:id
router.get('/:id', (req, res) => {
  const disaster = db.disasters.findById(req.params.id);
  if (!disaster) return res.status(404).json({ success: false, message: 'Not found' });
  res.json({ success: true, data: disaster });
});

export default router;