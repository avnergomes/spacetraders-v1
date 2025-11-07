import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import { HttpError } from '../middleware/errorHandler';
import { spaceTradersAPI } from '../services/spaceTradersAPI';

const router = Router();

router.get('/my/agent', authMiddleware, async (_req, res, next) => {
  try {
    const agent = await spaceTradersAPI.getAgent();
    res.json(agent);
  } catch (error) {
    next(error);
  }
});

router.post('/register', async (req, res, next) => {
  try {
    const { symbol, faction, email } = req.body;

    if (!symbol || !faction) {
      throw new HttpError(400, 'symbol and faction are required fields.');
    }

    const response = await spaceTradersAPI.registerAgent(symbol, faction, email);
    res.status(201).json(response);
  } catch (error) {
    next(error);
  }
});

export default router;
