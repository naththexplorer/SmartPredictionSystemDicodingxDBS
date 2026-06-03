import { v4 as uuidv4 } from 'uuid';
import { db } from '../models/db.js';

export const createReport = (req, res) => {
  try {
    const { location, description, disasterType, latitude, longitude } = req.body;

    if (!location || !description || !disasterType) {
      return res.status(400).json({ success: false, message: 'location, description, disasterType required' });
    }

    const reports = db.reports.getAll();
    const newReport = {
      id: uuidv4(),
      userId: req.user?.id || null,
      location,
      description,
      disasterType, // flood, earthquake, fire, landslide
      latitude: latitude || null,
      longitude: longitude || null,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    reports.push(newReport);
    db.reports.save(reports);

    res.status(201).json({ success: true, data: newReport });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getReports = (req, res) => {
  const reports = db.reports.getAll();
  res.json({ success: true, data: reports, total: reports.length });
};

export const getReportById = (req, res) => {
  const report = db.reports.findById(req.params.id);
  if (!report) return res.status(404).json({ success: false, message: 'Report not found' });
  res.json({ success: true, data: report });
};

export const updateReport = (req, res) => {
  try {
    const reports = db.reports.getAll();
    const index = reports.findIndex(r => r.id === req.params.id);

    if (index === -1) return res.status(404).json({ success: false, message: 'Report not found' });

    reports[index] = { ...reports[index], ...req.body, updatedAt: new Date().toISOString() };
    db.reports.save(reports);

    res.json({ success: true, data: reports[index] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const deleteReport = (req, res) => {
  const reports = db.reports.getAll();
  const filtered = reports.filter(r => r.id !== req.params.id);

  if (filtered.length === reports.length) {
    return res.status(404).json({ success: false, message: 'Report not found' });
  }

  db.reports.save(filtered);
  res.json({ success: true, message: 'Report deleted' });
};