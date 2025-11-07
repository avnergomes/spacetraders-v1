import { Router } from 'express';
import { HttpError } from '../middleware/errorHandler';
import { spaceTradersAPI } from '../services/spaceTradersAPI';

const router = Router();

router.get('/systems', async (req, res, next) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const systems = await spaceTradersAPI.getSystems(page, limit);
    res.json(systems);
  } catch (error) {
    next(error);
  }
});

router.get('/systems/:systemSymbol', async (req, res, next) => {
  try {
    const { systemSymbol } = req.params;
    const system = await spaceTradersAPI.getSystem(systemSymbol);
    res.json(system);
  } catch (error) {
    next(error);
  }
});

router.get('/systems/:systemSymbol/waypoints', async (req, res, next) => {
  try {
    const { systemSymbol } = req.params;
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const waypoints = await spaceTradersAPI.getWaypoints(systemSymbol, page, limit);
    res.json(waypoints);
  } catch (error) {
    next(error);
  }
});

router.get('/systems/:systemSymbol/waypoints/:waypointSymbol', async (req, res, next) => {
  try {
    const { systemSymbol, waypointSymbol } = req.params;
    const waypoint = await spaceTradersAPI.getWaypoint(systemSymbol, waypointSymbol);
    res.json(waypoint);
  } catch (error) {
    next(error);
  }
});

router.get('/systems/:systemSymbol/waypoints/:waypointSymbol/market', async (req, res, next) => {
  try {
    const { systemSymbol, waypointSymbol } = req.params;
    const market = await spaceTradersAPI.getMarket(systemSymbol, waypointSymbol);
    res.json(market);
  } catch (error) {
    next(error);
  }
});

router.get('/systems/:systemSymbol/waypoints/:waypointSymbol/shipyard', async (req, res, next) => {
  try {
    const { systemSymbol, waypointSymbol } = req.params;
    const shipyard = await spaceTradersAPI.getShipyard(systemSymbol, waypointSymbol);
    res.json(shipyard);
  } catch (error) {
    next(error);
  }
});

router.get('/systems/:systemSymbol/waypoints/:waypointSymbol/jump-gate', async (req, res, next) => {
  try {
    const { systemSymbol, waypointSymbol } = req.params;
    const jumpGate = await spaceTradersAPI.getJumpGate(systemSymbol, waypointSymbol);
    res.json(jumpGate);
  } catch (error) {
    next(error);
  }
});

router.post('/systems/:systemSymbol/waypoints/:waypointSymbol/construction/supply', async (req, res, next) => {
  try {
    const { systemSymbol, waypointSymbol } = req.params;
    const { shipSymbol, tradeSymbol, units } = req.body;

    if (!shipSymbol || !tradeSymbol || !units) {
      throw new HttpError(400, 'shipSymbol, tradeSymbol and units are required.');
    }

    const response = await spaceTradersAPI.supplyConstruction(systemSymbol, waypointSymbol, shipSymbol, tradeSymbol, units);
    res.json(response);
  } catch (error) {
    next(error);
  }
});

export default router;
