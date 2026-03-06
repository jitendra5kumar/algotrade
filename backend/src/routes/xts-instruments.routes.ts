import { Router } from "express";
import {
	updateAllInstruments,
	updateIndexInstruments,
	updateIndexInstrumentsGet,
	updateInstrumentsByExchange,
	getInstrumentsByExchange,
	searchInstruments,
	getInstrumentStats,
	getInstrumentByToken,
} from "../controllers/xts-instruments.controller";

const router = Router();

/**
 * @route   POST /api/xts-instruments/update-all
 * @desc    Update all XTS instruments from CSV sources (including index instruments)
 * @access  Public (Add admin auth if needed)
 */
router.post("/update-all", updateAllInstruments);

/**
 * @route   POST /api/xts-instruments/update-index
 * @desc    Update index instruments from CSV
 * @access  Public (Add admin auth if needed)
 */
router.post("/update-index", updateIndexInstruments);

/**
 * @route   GET /api/xts-instruments/update-index
 * @desc    Update index instruments from CSV (GET endpoint for browser testing)
 * @access  Public (Add admin auth if needed)
 */
router.get("/update-index", updateIndexInstrumentsGet);

/**
 * @route   POST /api/xts-instruments/update/:exchange
 * @desc    Update instruments from specific exchange (NSE_FO, NSE_CM, MCX_FO)
 * @access  Public (Add admin auth if needed)
 */
router.post("/update/:exchange", updateInstrumentsByExchange);

/**
 * @route   GET /api/xts-instruments/exchange/:exchange
 * @desc    Get instruments by exchange with pagination
 * @access  Public
 * @params  exchange: NSE_FO | NSE_CM | MCX_FO
 * @query   limit: number (default: 100, max: 1000)
 * @query   skip: number (default: 0)
 */
router.get("/exchange/:exchange", getInstrumentsByExchange);

/**
 * @route   GET /api/xts-instruments/search
 * @desc    Search instruments by name
 * @access  Public
 * @query   q: string (search term, min 2 characters)
 * @query   limit: number (default: 50, max: 200)
 */
router.get("/search", searchInstruments);

/**
 * @route   GET /api/xts-instruments/stats
 * @desc    Get instrument statistics
 * @access  Public
 */
router.get("/stats", getInstrumentStats);

/**
 * @route   GET /api/xts-instruments/token/:token
 * @desc    Get instrument by token
 * @access  Public
 * @params  token: number (instrument token)
 */
router.get("/token/:token", getInstrumentByToken);

export default router;
