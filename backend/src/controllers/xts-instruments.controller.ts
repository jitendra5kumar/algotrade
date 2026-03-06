import { Request, Response } from "express";
import asyncHandler from "express-async-handler";
import xtsInstrumentsService from "../services/xts-instruments.service";
import logger from "../utils/logger";

/**
 * @desc    Update all XTS instruments from CSV sources
 * @route   POST /api/xts-instruments/update-all
 * @access  Public (You can add admin auth later)
 */
export const updateAllInstruments = asyncHandler(async (_req: Request, res: Response) => {
	try {
		logger.info("Starting update of all XTS instruments");
		
		const result = await xtsInstrumentsService.updateAllInstruments();
		
		if (result.success) {
			logger.info("Successfully updated all XTS instruments");
			res.status(200).json({
				success: true,
				message: result.message,
				data: {
					totalInserted: result.totalInserted,
					totalErrors: result.totalErrors,
					results: result.results,
				},
			});
		} else {
			logger.warn("Partially failed to update XTS instruments");
			res.status(207).json({
				success: false,
				message: result.message,
				data: {
					totalInserted: result.totalInserted,
					totalErrors: result.totalErrors,
					results: result.results,
				},
			});
		}
	} catch (error) {
		logger.error("Error updating all XTS instruments:", error);
		res.status(500).json({
			success: false,
			message: "Internal server error while updating instruments",
			error: (error as Error)?.message || "Unknown error",
		});
	}
});

/**
 * @desc    Update index instruments from CSV (GET endpoint for browser testing)
 * @route   GET /api/xts-instruments/update-index
 * @access  Public (You can add admin auth later)
 */
export const updateIndexInstrumentsGet = asyncHandler(async (_req: Request, res: Response) => {
	try {
		logger.info("GET request received for update index instruments, forwarding to POST handler");
		const result = await xtsInstrumentsService.updateIndexInstruments();
		
		if (result.success) {
			logger.info("Successfully updated index instruments");
			res.status(200).json({
				success: true,
				message: result.message,
				data: {
					inserted: result.inserted,
					errors: result.errors,
				},
			});
		} else {
			logger.error("Failed to update index instruments");
			res.status(500).json({
				success: false,
				message: result.message,
				data: {
					inserted: result.inserted,
					errors: result.errors,
				},
			});
		}
	} catch (error) {
		logger.error("Error updating index instruments:", error);
		res.status(500).json({
			success: false,
			message: "Internal server error while updating index instruments",
			error: (error as Error)?.message || "Unknown error",
		});
	}
});

/**
 * @desc    Update index instruments from CSV
 * @route   POST /api/xts-instruments/update-index
 * @access  Public (You can add admin auth later)
 */
export const updateIndexInstruments = asyncHandler(async (_req: Request, res: Response) => {
	try {
		logger.info("Starting update of index instruments");
		
		const result = await xtsInstrumentsService.updateIndexInstruments();
		
		if (result.success) {
			logger.info("Successfully updated index instruments");
			res.status(200).json({
				success: true,
				message: result.message,
				data: {
					inserted: result.inserted,
					errors: result.errors,
				},
			});
		} else {
			logger.error("Failed to update index instruments");
			res.status(500).json({
				success: false,
				message: result.message,
				data: {
					inserted: result.inserted,
					errors: result.errors,
				},
			});
		}
	} catch (error) {
		logger.error("Error updating index instruments:", error);
		res.status(500).json({
			success: false,
			message: "Internal server error while updating index instruments",
			error: (error as Error)?.message || "Unknown error",
		});
	}
});

/**
 * @desc    Update instruments from specific exchange
 * @route   POST /api/xts-instruments/update/:exchange
 * @access  Public (You can add admin auth later)
 */
export const updateInstrumentsByExchange = asyncHandler(async (req: Request, res: Response) => {
	try {
		const { exchange } = req.params;
		
		// Map old format to new format (support both)
		const exchangeMap: Record<string, string> = {
			"NSE_FO": "NSEFO",
			"NSE_CM": "NSECM",
			"BSE_CM": "BSECM",
			"BSE_FO": "BSEFO",
			"MCX_FO": "MCXFO",
		};
		
		const exchangeSegment = exchangeMap[exchange] || exchange;
		
		// Validate exchange parameter
		const validExchanges = ["NSEFO", "NSECM", "BSECM", "BSEFO", "MCXFO"];
		if (!validExchanges.includes(exchangeSegment)) {
			res.status(400).json({
				success: false,
				message: "Invalid exchange. Valid exchanges are: NSEFO, NSECM, BSECM, BSEFO, MCXFO",
			});
			return;
		}

		logger.info(`Starting update of ${exchangeSegment} instruments`);
		
		const result = await xtsInstrumentsService.updateInstrumentsFromExchange(exchangeSegment);
		
		if (result.success) {
			logger.info(`Successfully updated ${exchangeSegment} instruments`);
			res.status(200).json({
				success: true,
				message: result.message,
				data: {
					exchange: exchangeSegment,
					inserted: result.inserted,
					updated: result.updated,
					errors: result.errors,
				},
			});
		} else {
			logger.error(`Failed to update ${exchangeSegment} instruments`);
			res.status(500).json({
				success: false,
				message: result.message,
				data: {
					exchange: exchangeSegment,
					inserted: result.inserted,
					updated: result.updated,
					errors: result.errors,
				},
			});
		}
	} catch (error) {
		logger.error(`Error updating ${req.params.exchange} instruments:`, error);
		res.status(500).json({
			success: false,
			message: "Internal server error while updating instruments",
			error: (error as Error)?.message || "Unknown error",
		});
	}
});

/**
 * @desc    Get instruments by exchange
 * @route   GET /api/xts-instruments/exchange/:exchange
 * @access  Public
 */
export const getInstrumentsByExchange = asyncHandler(async (req: Request, res: Response) => {
	try {
		const { exchange } = req.params;
		const { limit = 100, skip = 0 } = req.query;
		
		// Map old format to new format (support both)
		const exchangeMap: Record<string, string> = {
			"NSE_FO": "NSEFO",
			"NSE_CM": "NSECM",
			"BSE_CM": "BSECM",
			"BSE_FO": "BSEFO",
			"MCX_FO": "MCXFO",
		};
		
		const exchangeSegment = exchangeMap[exchange] || exchange;
		
		// Validate exchange parameter
		const validExchanges = ["NSEFO", "NSECM", "BSECM", "BSEFO", "MCXFO"];
		if (!validExchanges.includes(exchangeSegment)) {
			res.status(400).json({
				success: false,
				message: "Invalid exchange. Valid exchanges are: NSEFO, NSECM, BSECM, BSEFO, MCXFO",
			});
			return;
		}

		// Validate pagination parameters
		const limitNum = Math.min(parseInt(limit as string) || 100, 1000); // Max 1000 per request
		const skipNum = Math.max(parseInt(skip as string) || 0, 0);

		const instruments = await xtsInstrumentsService.getInstrumentsByExchange(
			exchangeSegment,
			limitNum,
			skipNum
		);

		res.status(200).json({
			success: true,
			message: `Retrieved ${instruments.length} instruments from ${exchangeSegment}`,
			data: {
				exchange: exchangeSegment,
				instruments,
				pagination: {
					limit: limitNum,
					skip: skipNum,
					count: instruments.length,
				},
			},
		});
	} catch (error) {
		logger.error(`Error fetching instruments for ${req.params.exchange}:`, error);
		res.status(500).json({
			success: false,
			message: "Internal server error while fetching instruments",
			error: (error as Error)?.message || "Unknown error",
		});
	}
});

/**
 * @desc    Search instruments by name
 * @route   GET /api/xts-instruments/search
 * @access  Public
 */
export const searchInstruments = asyncHandler(async (req: Request, res: Response) => {
	try {
		const { q, limit = 50 } = req.query;
		
		if (!q || typeof q !== "string" || q.trim().length < 2) {
			res.status(400).json({
				success: false,
				message: "Search query 'q' is required and must be at least 2 characters long",
			});
			return;
		}

		const limitNum = Math.min(parseInt(limit as string) || 50, 200); // Max 200 per request
		const searchTerm = q.trim();

		const instruments = await xtsInstrumentsService.searchInstruments(searchTerm, limitNum);

		res.status(200).json({
			success: true,
			message: `Found ${instruments.length} instruments matching "${searchTerm}"`,
			data: {
				searchTerm,
				instruments,
				count: instruments.length,
			},
		});
	} catch (error) {
		logger.error(`Error searching instruments for "${req.query.q}":`, error);
		res.status(500).json({
			success: false,
			message: "Internal server error while searching instruments",
			error: (error as Error)?.message || "Unknown error",
		});
	}
});

/**
 * @desc    Get instrument statistics
 * @route   GET /api/xts-instruments/stats
 * @access  Public
 */
export const getInstrumentStats = asyncHandler(async (_req: Request, res: Response) => {
	try {
		const stats = await xtsInstrumentsService.getInstrumentStats();

		res.status(200).json({
			success: true,
			message: "Retrieved instrument statistics",
			data: stats,
		});
	} catch (error) {
		logger.error("Error fetching instrument statistics:", error);
		res.status(500).json({
			success: false,
			message: "Internal server error while fetching statistics",
			error: (error as Error)?.message || "Unknown error",
		});
	}
});

/**
 * @desc    Get instrument by token
 * @route   GET /api/xts-instruments/token/:token
 * @access  Public
 */
export const getInstrumentByToken = asyncHandler(async (req: Request, res: Response) => {
	try {
		const { token } = req.params;
		
		if (!token || isNaN(parseInt(token))) {
			res.status(400).json({
				success: false,
				message: "Valid instrument token is required",
			});
			return;
		}

		const instrumentToken = parseInt(token);
		const instrument = await xtsInstrumentsService.getInstrumentByToken(instrumentToken);

		if (!instrument) {
			res.status(404).json({
				success: false,
				message: "Instrument not found",
			});
			return;
		}

		res.status(200).json({
			success: true,
			message: "Instrument found",
			data: {
				instrument,
			},
		});
	} catch (error) {
		logger.error(`Error fetching instrument with token ${req.params.token}:`, error);
		res.status(500).json({
			success: false,
			message: "Internal server error while fetching instrument",
			error: (error as Error)?.message || "Unknown error",
		});
	}
});
