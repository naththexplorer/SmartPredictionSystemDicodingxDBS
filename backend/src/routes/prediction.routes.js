import { Router } from 'express';
import { predict, getPredictions } from '../controllers/prediction.controller.js';

const router = Router();

router.post('/', predict);
router.get('/', getPredictions);

export default router;
