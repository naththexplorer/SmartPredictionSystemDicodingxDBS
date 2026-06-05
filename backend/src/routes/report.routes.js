import { Router } from 'express';
import {
  createReport, getReports, getReportById, updateReport, deleteReport
} from '../controllers/report.controller.js';

const router = Router();

router.get('/', getReports);
router.get('/:id', getReportById);
router.post('/', createReport);
router.put('/:id', updateReport);
router.delete('/:id', deleteReport);

export default router;
