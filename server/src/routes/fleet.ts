import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import { HttpError } from '../middleware/errorHandler';
import { spaceTradersAPI } from '../services/spaceTradersAPI';

const router = Router();

router.get('/my/ships', authMiddleware, async (_req, res, next) => {
  try {
    const fleet = await spaceTradersAPI.getFleet();
    res.json(fleet);
  } catch (error) {
    next(error);
  }
});

router.get('/my/ships/:shipSymbol', authMiddleware, async (req, res, next) => {
  try {
    const { shipSymbol } = req.params;
    const ship = await spaceTradersAPI.getShip(shipSymbol);
    res.json(ship);
  } catch (error) {
    next(error);
  }
});

router.post('/my/ships', authMiddleware, async (req, res, next) => {
  try {
    const { shipType, waypointSymbol } = req.body;

    if (!shipType || !waypointSymbol) {
      throw new HttpError(400, 'shipType and waypointSymbol are required.');
    }

    const response = await spaceTradersAPI.purchaseShip(shipType, waypointSymbol);
    res.status(201).json(response);
  } catch (error) {
    next(error);
  }
});

router.post('/my/ships/:shipSymbol/navigate', authMiddleware, async (req, res, next) => {
  try {
    const { shipSymbol } = req.params;
    const { waypointSymbol } = req.body;

    if (!waypointSymbol) {
      throw new HttpError(400, 'waypointSymbol is required.');
    }

    const response = await spaceTradersAPI.navigateShip(shipSymbol, waypointSymbol);
    res.json(response);
  } catch (error) {
    next(error);
  }
});

router.post('/my/ships/:shipSymbol/dock', authMiddleware, async (req, res, next) => {
  try {
    const { shipSymbol } = req.params;
    const response = await spaceTradersAPI.dockShip(shipSymbol);
    res.json(response);
  } catch (error) {
    next(error);
  }
});

router.post('/my/ships/:shipSymbol/orbit', authMiddleware, async (req, res, next) => {
  try {
    const { shipSymbol } = req.params;
    const response = await spaceTradersAPI.orbitShip(shipSymbol);
    res.json(response);
  } catch (error) {
    next(error);
  }
});

router.post('/my/ships/:shipSymbol/refuel', authMiddleware, async (req, res, next) => {
  try {
    const { shipSymbol } = req.params;
    const { units, fromCargo } = req.body;
    const response = await spaceTradersAPI.refuelShip(shipSymbol, units, fromCargo);
    res.json(response);
  } catch (error) {
    next(error);
  }
});

router.post('/my/ships/:shipSymbol/extract', authMiddleware, async (req, res, next) => {
  try {
    const { shipSymbol } = req.params;
    const response = await spaceTradersAPI.extractResources(shipSymbol);
    res.json(response);
  } catch (error) {
    next(error);
  }
});

router.post('/my/ships/:shipSymbol/sell', authMiddleware, async (req, res, next) => {
  try {
    const { shipSymbol } = req.params;
    const { symbol, units } = req.body;

    if (!symbol || !units) {
      throw new HttpError(400, 'symbol and units are required.');
    }

    const response = await spaceTradersAPI.sellCargo(shipSymbol, symbol, units);
    res.json(response);
  } catch (error) {
    next(error);
  }
});

router.post('/my/ships/:shipSymbol/purchase', authMiddleware, async (req, res, next) => {
  try {
    const { shipSymbol } = req.params;
    const { symbol, units } = req.body;

    if (!symbol || !units) {
      throw new HttpError(400, 'symbol and units are required.');
    }

    const response = await spaceTradersAPI.purchaseCargo(shipSymbol, symbol, units);
    res.json(response);
  } catch (error) {
    next(error);
  }
});

router.post('/my/ships/:shipSymbol/transfer', authMiddleware, async (req, res, next) => {
  try {
    const { shipSymbol } = req.params;
    const { tradeSymbol, units, toShipSymbol } = req.body;

    if (!tradeSymbol || !units || !toShipSymbol) {
      throw new HttpError(400, 'tradeSymbol, units and toShipSymbol are required.');
    }

    const response = await spaceTradersAPI.transferCargo(shipSymbol, tradeSymbol, units, toShipSymbol);
    res.json(response);
  } catch (error) {
    next(error);
  }
});

router.post('/my/ships/:shipSymbol/jettison', authMiddleware, async (req, res, next) => {
  try {
    const { shipSymbol } = req.params;
    const { symbol, units } = req.body;

    if (!symbol || !units) {
      throw new HttpError(400, 'symbol and units are required.');
    }

    const response = await spaceTradersAPI.jettison(shipSymbol, symbol, units);
    res.json(response);
  } catch (error) {
    next(error);
  }
});

export default router;
