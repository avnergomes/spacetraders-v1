import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import { HttpError } from '../middleware/errorHandler';
import { spaceTradersAPI } from '../services/spaceTradersAPI';

const router = Router();

router.get('/my/contracts', authMiddleware, async (req, res, next) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const contracts = await spaceTradersAPI.getContracts(page, limit);
    res.json(contracts);
  } catch (error) {
    next(error);
  }
});

router.get('/my/contracts/:contractId', authMiddleware, async (req, res, next) => {
  try {
    const { contractId } = req.params;
    const contract = await spaceTradersAPI.getContract(contractId);
    res.json(contract);
  } catch (error) {
    next(error);
  }
});

router.post('/my/contracts/:contractId/accept', authMiddleware, async (req, res, next) => {
  try {
    const { contractId } = req.params;
    const response = await spaceTradersAPI.acceptContract(contractId);
    res.json(response);
  } catch (error) {
    next(error);
  }
});

router.post('/my/contracts/:contractId/deliver', authMiddleware, async (req, res, next) => {
  try {
    const { contractId } = req.params;
    const { shipSymbol, tradeSymbol, units } = req.body;

    if (!shipSymbol || !tradeSymbol || !units) {
      throw new HttpError(400, 'shipSymbol, tradeSymbol and units are required.');
    }

    const response = await spaceTradersAPI.deliverContract(contractId, shipSymbol, tradeSymbol, units);
    res.json(response);
  } catch (error) {
    next(error);
  }
});

router.post('/my/contracts/:contractId/fulfill', authMiddleware, async (req, res, next) => {
  try {
    const { contractId } = req.params;
    const response = await spaceTradersAPI.fulfillContract(contractId);
    res.json(response);
  } catch (error) {
    next(error);
  }
});

export default router;
