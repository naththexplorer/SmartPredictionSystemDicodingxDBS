import { Router } from 'express';
import { predict, getPredictions } from '../controllers/prediction.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();

router.post('/', predict);
router.get('/', authenticate, getPredictions);

export default router;