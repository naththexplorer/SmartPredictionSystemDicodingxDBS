import { db } from '../models/db.js';

export const getDisasters = (req, res) => {
  const disasters = db.disasters.getAll();
  res.json({ success: true, data: disasters, total: disasters.length });
};

export const getDisasterById = (req, res) => {
  const disaster = db.disasters.findById(req.params.id);
  if (!disaster) return res.status(404).json({ success: false, message: 'Not found' });
  res.json({ success: true, data: disaster });
};