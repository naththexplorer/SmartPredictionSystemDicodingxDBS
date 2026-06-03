import { Router } from 'express';
import {
  createReport, getReports, getReportById, updateReport, deleteReport
} from '../controllers/report.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();

router.get('/', getReports);
router.get('/:id', getReportById);
router.post('/', authenticate, createReport);
router.put('/:id', authenticate, updateReport);
router.delete('/:id', authenticate, deleteReport);

export default router;