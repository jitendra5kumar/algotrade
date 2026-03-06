import type { Request, Response } from "express";
import { Types } from "mongoose";
import Strategy, { IStrategy } from "../models/Strategy.model";
import StrategyTemplate from "../models/StrategyTemplate.model";
import { ActivityLogService } from "../services/activity-log.service";
import { BrokerService } from "../services/broker.service";
import strategyExecutionService from "../services/strategy-execution.service";
import strategyLogService from "../services/strategy-log.service";
import strategyMonitor from "../strategies/strategy-monitor";
import { sendError, sendSuccess } from "../utils/helpers";
import logger from "../utils/logger";

// Type definitions for indicator configurations
interface IndicatorConfig {
	parameters: Record<string, unknown>;
	isVisible: boolean;
	isEditable: boolean;
	validationRules?: {
		[paramName: string]: {
			min?: number;
			max?: number;
			required?: boolean;
		};
	};
}

type IndicatorConfigMap = Map<string, IndicatorConfig> | Record<string, IndicatorConfig>;

function getExchangeSegment(segment: number | string): string {
	// Handle both number and string inputs
	if (typeof segment === 'string') {
		// If already a string, validate and return
		const validSegments = ['NSECM', 'NSEFO', 'NSECD', 'BSECM', 'BSEFO', 'MCXFO'];
		if (validSegments.includes(segment)) {
			return segment;
		}
		// Try to convert string number to actual segment
		const numSegment = parseInt(segment, 10);
		if (!isNaN(numSegment)) {
			segment = numSegment;
		} else {
			return 'NSECM'; // Default fallback
		}
	}
	
	// Correct mapping: 1=NSECM, 2=NSEFO, 3=NSECD, 11=BSECM, 12=BSEFO, 51=MCXFO
	switch (segment) {
		case 1:
			return "NSECM"; // NSE Cash Market
		case 2:
			return "NSEFO"; // NSE Futures & Options
		case 3:
			return "NSECD"; // NSE Currency Derivatives
		case 11:
			return "BSECM"; // BSE Cash Market
		case 12:
			return "BSEFO"; // BSE Futures & Options
		case 51:
			return "MCXFO"; // MCX Futures & Options
		default:
			return "NSECM"; // Default to NSECM
	}
}

/**
 * Safely parse float value, returning undefined for invalid/empty values instead of NaN
 */
function safeParseFloat(value: string | number | undefined | null): number | undefined {
	if (value === undefined || value === null || value === "") {
		return undefined;
	}
	const parsed = typeof value === "string" ? parseFloat(value) : Number(value);
	return Number.isFinite(parsed) && !isNaN(parsed) ? parsed : undefined;
}

/**
 * Map frontend strategyType to database enum value
 */
function mapStrategyType(strategyType: string): 'GO_SCALP' | 'GO_MONEY' | 'CUSTOM' | 'NORMAL' | 'SCALPING' | 'OPTIONS' | 'FUTURES' {
	const typeMap: Record<string, 'GO_SCALP' | 'GO_MONEY' | 'CUSTOM' | 'NORMAL' | 'SCALPING' | 'OPTIONS' | 'FUTURES'> = {
		'stocks': 'NORMAL',
		'normal': 'NORMAL',
		'futures': 'FUTURES',
		'options': 'OPTIONS',
		'scalping': 'SCALPING',
		'go_scalp': 'GO_SCALP',
		'go_money': 'GO_MONEY',
		'custom': 'CUSTOM',
	};
	
	const normalizedType = strategyType.toLowerCase();
	return typeMap[normalizedType] || 'NORMAL';
}

class StrategyController {
	/**
	 * Create new strategy (simplified for frontend form)
	 * POST /api/strategies/simple
	 */
	public async createSimpleStrategy(
		req: Request,
		res: Response,
	): Promise<Response> {
		try {
			const userId = req.user?.userId;
			if (!userId) {
				return sendError(res, "Not authorized", 401);
			}

			const {
				templateId, // NEW: Optional template ID
				indicatorOverrides, // NEW: User modifications to editable params
				strategyType,
				signalsType,
				symbol,
				selectedInstrument,
				timeframe,
				expiry,
				tradeMode,
				gap,
				stoploss,
				target,
				stoplossEnabled,
				targetEnabled,
				stoplossType,
				targetType,
				productType,
				orderType,
				qty,
				selectedIndicators,
				indicatorConfig,
				maxRiskPerTradePercent,
				trailingStopLoss,
				intradayEnabled,
				tradingWindowEnabled,
				tradingStartTime,
				tradingEndTime,
				squareOffTime,
			} = req.body;
			console.log("inst_id", selectedInstrument);
			// Validate required fields
			if (
				!strategyType ||
				!signalsType ||
				!symbol ||
				!productType ||
				!orderType ||
				!qty
			) {
				return sendError(res, "All required fields must be provided", 400);
			}

			let finalIndicatorConfig = indicatorConfig || {};
			let strategyName = "Custom Strategy";
			let isTemplateBased = false;

			// If template-based strategy
			if (templateId) {
				const template = await StrategyTemplate.findById(templateId);
				if (!template || !template.isActive || !template.isVisibleToUsers) {
					return sendError(res, "Invalid template", 400);
				}

				// Use template's indicator configuration
				finalIndicatorConfig = {};
				const configMap = template.indicators.configurations as IndicatorConfigMap;

				// Convert Map to object if needed
				let configObj: Record<string, IndicatorConfig> = {};
				if (configMap instanceof Map) {
					for (const [key, config] of configMap.entries()) {
						configObj[key] = config;
					}
				} else {
					configObj = configMap;
				}

				// Build indicator config from template
				for (const [key, config] of Object.entries(configObj)) {
					finalIndicatorConfig[key] = { ...config.parameters };

					// Apply user overrides if parameter is editable
					if (
						config.isEditable &&
						indicatorOverrides &&
						indicatorOverrides[key]
					) {
						// Validate overrides against rules
						const overrides = indicatorOverrides[key];
						for (const [param, value] of Object.entries(overrides)) {
							const validationRules = config.validationRules?.[param];
							if (validationRules) {
								const numValue = parseFloat(value as string);
								if (
									validationRules.min !== undefined &&
									numValue < validationRules.min
								) {
									return sendError(
										res,
										`Parameter ${param} must be at least ${validationRules.min}`,
										400,
									);
								}
								if (
									validationRules.max !== undefined &&
									numValue > validationRules.max
								) {
									return sendError(
										res,
										`Parameter ${param} must be at most ${validationRules.max}`,
										400,
									);
								}
							}
						}
						finalIndicatorConfig[key] = {
							...finalIndicatorConfig[key],
							...overrides,
						};
					}
				}

				strategyName = template.name;
				isTemplateBased = true;

				// Update template usage count
				await StrategyTemplate.findByIdAndUpdate(templateId, {
					$inc: { usageCount: 1 },
					lastUsedAt: new Date(),
				});
			} else {
				// Custom strategy (existing flow)
				finalIndicatorConfig = indicatorConfig || {};
				strategyName =
					selectedIndicators && selectedIndicators.length > 0
						? `${selectedIndicators.map((ind: string) => ind.toUpperCase()).join(" + ")} Strategy`
						: "Custom Strategy";
			}

			// Parse and validate numeric values
			const parsedQty = parseInt(qty);
			// Only parse stoploss/target if their toggles are enabled
			const parsedStoploss =
				stoplossEnabled && stoploss ? parseFloat(stoploss) : 0;
			const parsedTarget =
				targetEnabled && target ? parseFloat(target) : 0;

			if (isNaN(parsedQty) || parsedQty <= 0) {
				return sendError(res, "Quantity must be a valid positive number", 400);
			}

			logger.info("Creating strategy with data:", {
				strategyName,
				strategyType,
				signalsType,
				symbol,
				selectedIndicators,
				stoploss: parsedStoploss,
				target: parsedTarget,
				productType,
				orderType,
				qty: parsedQty,
			});

			// Get instrument ID with proper fallback
			const instrumentId =
				selectedInstrument?.exchangeInstrumentID ||
				selectedInstrument?.instrumentToken ||
				this.getInstrumentId(symbol);

			// Auto-correct exchangeSegment for all index instruments - should be NSECM (1) with series INDEX
			// Index instruments come from index_instruments collection
			let finalExchangeSegment = selectedInstrument?.exchangeSegment || "NSECM";
			
			// Check if this is an index instrument by:
			// 1. isIndex flag from frontend
			// 2. exchangeName === 'NSE INDEX'
			// 3. Check if instrument exists in IndexInstrument collection
			const isIndexInstrument = 
				selectedInstrument?.isIndex === true || 
				selectedInstrument?.exchangeName === 'NSE INDEX';
			
			if (isIndexInstrument) {
				finalExchangeSegment = "NSECM"; // Force NSECM for all index instruments
				logger.info("Auto-corrected exchangeSegment for index instrument to NSECM", {
					instrumentId,
					symbol,
					originalSegment: selectedInstrument?.exchangeSegment,
				});
			} else {
				// Also check in IndexInstrument collection as fallback
				try {
					const { default: IndexInstrument } = await import('../models/IndexInstrument.model');
					const indexInstrument = await IndexInstrument.findOne({ 
						exchangeInstrumentId: instrumentId 
					}).lean();
					
					if (indexInstrument) {
						finalExchangeSegment = "NSECM"; // Force NSECM for index instruments
						logger.info("Found instrument in IndexInstrument collection, using NSECM", {
							instrumentId,
							symbol,
							indexName: indexInstrument.name,
						});
					}
				} catch (error) {
					// If IndexInstrument model not available, continue with original segment
					logger.debug("Could not check IndexInstrument collection", { error: (error as Error).message });
				}
			}

			logger.info("Strategy creation - Instrument details:", {
				symbol,
				selectedInstrument,
				instrumentId,
				originalExchangeSegment: selectedInstrument?.exchangeSegment,
				finalExchangeSegment,
			});

			// For options strategies, fetch actual instrument name from xts_instruments
			let actualInstrumentName = selectedInstrument?.name;
			let actualDisplayName = selectedInstrument?.displayName;
			
			if (strategyType === "options" && selectedInstrument?.isIndex) {
				try {
					// Query xts_instruments for the actual instrument name
					// For "NIFTY 50" in index_instruments, we need to find "NIFTY" in xts_instruments
					const XtsInstrument = (await import('../models/XtsInstrument.model')).default;
					
					// The index name from index_instruments (e.g., "NIFTY 50")
					const indexName = selectedInstrument.name;
					
					// Extract the base name (e.g., "NIFTY" from "NIFTY 50", "BANKNIFTY" from "NIFTY BANK")
					// Common patterns: "NIFTY 50", "NIFTY BANK", "FINNIFTY", etc.
					const baseNameMatch = indexName.match(/^(\w+)/);
					const baseName = baseNameMatch ? baseNameMatch[1] : indexName.split(' ')[0];
					
					// Find an instrument in xts_instruments with matching underlyingIndexName
					const xtsInstrument = await XtsInstrument.findOne({
						underlyingIndexName: { $regex: `^${indexName}$`, $options: 'i' },
						series: 'OPTIDX'
					}).select('name displayName').lean();
					
					if (xtsInstrument) {
						actualInstrumentName = xtsInstrument.name || baseName;
						actualDisplayName = xtsInstrument.displayName || xtsInstrument.name;
						logger.info("Found xts_instruments name for index:", {
							indexName,
							actualInstrumentName,
							actualDisplayName
						});
					} else {
						// Fallback to base name if no match found
						actualInstrumentName = baseName;
						logger.warn("No matching xts_instrument found, using base name:", { indexName, baseName });
					}
				} catch (error) {
					logger.error("Error fetching instrument name from xts_instruments:", error);
					// Keep the original name as fallback
				}
			}

			// Map frontend form data to Strategy model
			const strategyData: Partial<IStrategy> & { selectedIndicators?: string[] } = {
				userId: userId as unknown as Types.ObjectId,
				name: `${strategyName} - ${symbol}`,
				type: mapStrategyType(strategyType),
				symbol: symbol.toUpperCase(),
				exchangeSegment: getExchangeSegment(
					finalExchangeSegment || 1, // Default to NSECM
				),
				exchangeInstrumentID: instrumentId,
				instrumentName: actualInstrumentName || undefined,
				instrumentDisplayName: actualDisplayName || undefined,
				timeframe:
					timeframe || (strategyType === "scalping" ? "5min" : "15min"),
				status: "INACTIVE",
				selectedIndicators: selectedIndicators || [],
				templateId: templateId || undefined,
				isCustomStrategy: !isTemplateBased,
				indicatorOverrides: indicatorOverrides || undefined,
				config: {
					entryConditions: [
						signalsType === "candleClose"
							? "Candle Close Signal"
							: "High Low Break Signal",
					],
					exitConditions: ["Stop Loss", "Target"],
					entryMode:
						signalsType === "candleClose" ? "candleClose" : "highLowBreak",
					indicators: finalIndicatorConfig,
					stopLossPoints: parsedStoploss,
					targetPoints: parsedTarget,
					// Only set stoplossType/targetType if enabled
					...(stoplossEnabled && stoplossType ? { stoplossType: stoplossType } : {}),
					...(targetEnabled && targetType ? { targetType: targetType } : {}),
					trailingStopLoss: safeParseFloat(trailingStopLoss),
					maxRiskPerTradePercent: safeParseFloat(maxRiskPerTradePercent),
					maxPositionSize: parsedQty,
					maxDailyLoss: 5,
					orderType: orderType.toUpperCase() as "MARKET" | "LIMIT",
					productType: productType.toUpperCase() as "MIS" | "NRML" | "CNC",
					quantity: parsedQty,
					checkInterval: 60000,
					intradayEnabled: Boolean(intradayEnabled),
					tradingWindowEnabled: Boolean(tradingWindowEnabled),
					tradingStartTime: tradingStartTime || "09:15",
					tradingEndTime: tradingEndTime || "15:30",
					squareOffTime: squareOffTime || undefined,
					// Options specific fields - only set if strategyType is options
					...(strategyType === "options" ? {
						expiry: expiry || undefined,
						tradeMode: (tradeMode || "atm") as "atm" | "itm" | "otm",
						gap: gap ? safeParseFloat(gap) : undefined,
					} : {}),
				},
				performance: {
					totalTrades: 0,
					winningTrades: 0,
					losingTrades: 0,
					winRate: 0,
					totalProfit: 0,
					totalLoss: 0,
					netProfit: 0,
					maxDrawdown: 0,
					avgWinAmount: 0,
					avgLossAmount: 0,
					profitFactor: 0,
					lastUpdated: new Date(),
				},
				isMonitoring: false,
			};

			const newStrategy = await Strategy.create(strategyData);

			logger.info(
				`Simple strategy created: ${newStrategy.name} by user ${userId}`,
			);

			// Log activity (non-blocking - don't fail if logging fails)
			try {
				await ActivityLogService.createLog({
					userId,
					type: "strategy",
					title: "Strategy Created",
					description: `Created new strategy "${strategyName}" for ${symbol.toUpperCase()}`,
					status: "success",
					metadata: {
						strategyId: newStrategy._id,
						symbol: symbol.toUpperCase(),
						indicators: selectedIndicators,
					},
				});
			} catch (logError) {
				logger.error("Failed to log activity, but continuing:", logError);
			}

			// Return simplified response matching frontend expectations
			const response = {
				id: newStrategy._id,
				_id: newStrategy._id,
				strategy: strategyName,
				strategyType,
				signalsType,
				symbol: symbol.toUpperCase(),
				selectedIndicators: selectedIndicators || [],
				indicatorConfig: indicatorConfig || {},
				expiry: expiry || "",
				tradeMode: tradeMode || "atm",
				gap: gap || "",
				stoploss: parsedStoploss || 0,
				target: parsedTarget || 0,
				stoplossEnabled: Boolean(parsedStoploss),
				targetEnabled: Boolean(parsedTarget),
				productType: productType.toLowerCase(),
				orderType: orderType.toLowerCase(),
				qty: parsedQty,
				isActive: false,
				createdAt:
					newStrategy.createdAt?.toLocaleString() ||
					new Date().toLocaleString(),
			};

			logger.info(
				"Strategy created successfully, returning response:",
				response,
			);

			return sendSuccess(res, response, "Strategy created successfully", 201);
		} catch (error: unknown) {
			logger.error("Error creating simple strategy:", error);
			return sendError(
				res,
				(error as Error).message || "Failed to create strategy",
				400,
			);
		}
	}

	/**
	 * Create new strategy
	 * POST /api/strategies
	 */
	public async createStrategy(req: Request, res: Response): Promise<Response> {
		try {
			const userId = req.user?.userId;
			if (!userId) {
				return sendError(res, "Not authorized", 401);
			}

			const strategyData = {
				...req.body,
				userId,
			};

			const strategy = await Strategy.create(strategyData);

			logger.info(`Strategy created: ${strategy.name} by user ${userId}`);

			return sendSuccess(res, strategy, "Strategy created successfully", 201);
		} catch (error: unknown) {
			logger.error("Error creating strategy:", error);
			return sendError(
				res,
				(error as Error).message || "Failed to create strategy",
				400,
			);
		}
	}

	/**
	 * Get all strategies for user (simplified format)
	 * GET /api/strategies/simple
	 */
	public async getSimpleStrategies(
		req: Request,
		res: Response,
	): Promise<Response> {
		try {
			const userId = req.user?.userId;
			if (!userId) {
				return sendError(res, "Not authorized", 401);
			}

			const strategies = await Strategy.find({ userId }).sort({
				createdAt: -1,
			});

			// Convert to simplified format for frontend
			const simplifiedStrategies = strategies.map((s) => ({
				id: s._id,
				_id: s._id,
				name: s.name || (s.type === "GO_SCALP" ? "goscalp" : "gomoney"),
				strategy: s.name || (s.type === "GO_SCALP" ? "goscalp" : "gomoney"),
				strategyType: s.type?.toLowerCase() || "normal",
				signalsType: s.config.entryConditions?.[0]?.includes("Candle")
					? "candleClose"
					: "highLowBreak",
				symbol: s.symbol,
				exchangeSegment: s.exchangeSegment,
				exchangeInstrumentID: s.exchangeInstrumentID,
				timeframe: s.timeframe,
				templateId: s.templateId || null, // Include templateId
				indicatorOverrides: s.indicatorOverrides || null, // Include indicator overrides
				selectedIndicators: (s as IStrategy & { selectedIndicators?: string[] }).selectedIndicators || [],
				indicatorConfig: s.config.indicators || {}, // Include indicator config
				// Options specific fields
				expiry: s.config.expiry || "",
				tradeMode: s.config.tradeMode || "atm",
				gap: s.config.gap?.toString() || "",
				stoploss: s.config.stopLossPoints || 0,
				target: s.config.targetPoints || 0,
				stoplossEnabled: (s.config.stopLossPoints || 0) > 0,
				targetEnabled: (s.config.targetPoints || 0) > 0,
				status: s.status,
				productType: s.config.productType?.toLowerCase() || "mis",
				orderType: s.config.orderType?.toLowerCase() || "market",
				qty: s.config.quantity,
				isActive: s.isMonitoring,
				intradayEnabled: s.config.intradayEnabled || false,
				tradingWindowEnabled: s.config.tradingWindowEnabled || false,
				tradingStartTime: s.config.tradingStartTime || "09:15",
				tradingEndTime: s.config.tradingEndTime || "15:30",
				squareOffTime: s.config.squareOffTime || "",
				trailingStopLoss: s.config.trailingStopLoss || "",
				maxRiskPerTradePercent: s.config.maxRiskPerTradePercent || "",
				config: s.config, // Include full config for additional fields
				createdAt: s.createdAt?.toLocaleString() || new Date().toLocaleString(),
			}));

			return sendSuccess(
				res,
				simplifiedStrategies,
				"Strategies retrieved successfully",
			);
		} catch (error: unknown) {
			logger.error("Error fetching simple strategies:", error);
			return sendError(res, (error as Error).message, 500);
		}
	}

	/**
	 * Get all strategies for user
	 * GET /api/strategies
	 */
	public async getStrategies(req: Request, res: Response): Promise<Response> {
		try {
			const userId = req.user?.userId;
			if (!userId) {
				return sendError(res, "Not authorized", 401);
			}

			const { status, type } = req.query;

			const filter: Record<string, unknown> = { userId };
			if (status) filter.status = status;
			if (type) filter.type = type;

			const strategies = await Strategy.find(filter).sort({ createdAt: -1 });

			return sendSuccess(res, strategies, "Strategies retrieved successfully");
		} catch (error: unknown) {
			logger.error("Error fetching strategies:", error);
			return sendError(res, (error as Error).message, 500);
		}
	}

	/**
	 * Get strategy by ID
	 * GET /api/strategies/:id
	 */
	public async getStrategyById(req: Request, res: Response): Promise<Response> {
		try {
			const userId = req.user?.userId;
			const { id } = req.params;

			const strategy = await Strategy.findOne({ _id: id, userId });

			if (!strategy) {
				return sendError(res, "Strategy not found", 404);
			}

			return sendSuccess(res, strategy, "Strategy retrieved successfully");
		} catch (error: unknown) {
			logger.error("Error fetching strategy:", error);
			return sendError(res, (error as Error).message, 500);
		}
	}

	/**
	 * Update strategy
	 * PUT /api/strategies/:id
	 */
	public async updateStrategy(req: Request, res: Response): Promise<Response> {
		try {
			const userId = req.user?.userId;
			const { id } = req.params;

			// Don't allow updating if strategy is active
			const existingStrategy = await Strategy.findOne({ _id: id, userId });

			if (!existingStrategy) {
				return sendError(res, "Strategy not found", 404);
			}

			if (existingStrategy.isMonitoring) {
				return sendError(
					res,
					"Cannot update strategy while it is running. Please stop it first.",
					400,
				);
			}

			// Whitelist allowed fields including new intraday settings
			const { config = {}, ...rest } = req.body || {};

			const updatePayload: Partial<IStrategy> = { ...rest };
			if (config) {
				updatePayload["config"] = {
					...existingStrategy.config,
					...config,
					// Normalize booleans and times if present
					intradayEnabled:
						config.intradayEnabled !== undefined
							? Boolean(config.intradayEnabled)
							: existingStrategy.config.intradayEnabled,
					tradingWindowEnabled:
						config.tradingWindowEnabled !== undefined
							? Boolean(config.tradingWindowEnabled)
							: existingStrategy.config.tradingWindowEnabled,
					tradingStartTime:
						config.tradingStartTime || existingStrategy.config.tradingStartTime,
					tradingEndTime:
						config.tradingEndTime || existingStrategy.config.tradingEndTime,
					squareOffTime:
						config.squareOffTime || existingStrategy.config.squareOffTime,
					trailingStopLoss:
						config.trailingStopLoss !== undefined
							? safeParseFloat(config.trailingStopLoss as string | number)
							: existingStrategy.config.trailingStopLoss,
					maxRiskPerTradePercent:
						config.maxRiskPerTradePercent !== undefined
							? safeParseFloat(config.maxRiskPerTradePercent as string | number)
							: existingStrategy.config.maxRiskPerTradePercent,
					entryMode: config.entryMode || existingStrategy.config.entryMode,
					// consensus not used anymore; keep existing value if present
				};
			}

			const strategy = await Strategy.findOneAndUpdate(
				{ _id: id, userId },
				updatePayload,
				{ new: true, runValidators: true },
			);

			if (!strategy) {
				return sendError(res, "Strategy not found", 404);
			}

			logger.info(`Strategy updated: ${strategy.name}`);

			return sendSuccess(res, strategy, "Strategy updated successfully");
		} catch (error: unknown) {
			logger.error("Error updating strategy:", error);
			return sendError(res, (error as Error).message, 400);
		}
	}

	/**
	 * Update simple strategy
	 * PUT /api/strategies/simple/:id
	 */
	public async updateSimpleStrategy(
		req: Request,
		res: Response,
	): Promise<Response> {
		try {
			const userId = req.user?.userId;
			if (!userId) {
				return sendError(res, "Not authorized", 401);
			}
			const { id } = req.params;

			const existingStrategy = await Strategy.findOne({ _id: id, userId });

			if (!existingStrategy) {
				return sendError(res, "Strategy not found", 404);
			}

			if (existingStrategy.isMonitoring) {
				return sendError(
					res,
					"Cannot update strategy while it is running. Please stop it first.",
					400,
				);
			}

			const {
				strategy,
				strategyType,
				signalsType,
				symbol,
				timeframe,
				expiry,
				tradeMode,
				gap,
				stoploss,
				target,
				stoplossEnabled,
				targetEnabled,
				stoplossType,
				targetType,
				productType,
				orderType,
				qty,
				intradayEnabled,
				tradingWindowEnabled,
				tradingStartTime,
				tradingEndTime,
				squareOffTime,
				trailingStopLoss,
				maxRiskPerTradePercent,
			} = req.body;

			// Update strategy with new data
			existingStrategy.name = `${strategy === "goscalp" ? "Go Scalp" : "Go Money"} - ${symbol}`;
			existingStrategy.type = strategy === "goscalp" ? "GO_SCALP" : "GO_MONEY";
			existingStrategy.symbol = symbol.toUpperCase();
			// Use timeframe from request body, fallback to default based on strategy type
			const oldTimeframe = existingStrategy.timeframe;
			existingStrategy.timeframe = timeframe || (strategy === "goscalp" ? "5min" : "15min");
			
			// Store old entryMode before updating
			const oldEntryMode = existingStrategy.config.entryMode;
			existingStrategy.config.entryConditions = [
				signalsType === "candleClose"
					? "Candle Close Signal"
					: "High Low Break Signal",
			];
			// Update entryMode based on signalsType
			existingStrategy.config.entryMode = signalsType === "candleClose" ? "candleClose" : "highLowBreak";
			
			// If timeframe or entryMode changed and strategy is monitoring, restart monitoring
			const timeframeChanged = oldTimeframe !== existingStrategy.timeframe;
			const entryModeChanged = oldEntryMode !== existingStrategy.config.entryMode;
			
			if ((timeframeChanged || entryModeChanged) && existingStrategy.isMonitoring) {
				logger.info(`Strategy config changed (timeframe: ${timeframeChanged ? `${oldTimeframe}→${existingStrategy.timeframe}` : 'unchanged'}, entryMode: ${entryModeChanged ? `${oldEntryMode}→${existingStrategy.config.entryMode}` : 'unchanged'}), restarting monitoring`);
				try {
					// Pause first
					await strategyMonitor.pauseStrategy(id);
					// Then resume with new config (will recalculate interval and use correct entry mode)
					await strategyMonitor.resumeStrategy(id);
				} catch (monitorError) {
					logger.warn(`Failed to restart monitoring after config change: ${monitorError}`);
					// Continue with save even if restart fails
				}
			}
			
			// Only set stoploss/target if their respective toggles are enabled
			if (stoplossEnabled) {
				existingStrategy.config.stopLossPoints = stoploss ? parseFloat(stoploss) : 0;
				if (stoplossType) {
					(existingStrategy.config as any).stoplossType = stoplossType;
				}
			} else {
				// If toggle is OFF, set to 0 or undefined
				existingStrategy.config.stopLossPoints = 0;
				delete (existingStrategy.config as any).stoplossType;
			}

			if (targetEnabled) {
				existingStrategy.config.targetPoints = target ? parseFloat(target) : 0;
				if (targetType) {
					(existingStrategy.config as any).targetType = targetType;
				}
			} else {
				// If toggle is OFF, set to 0 or undefined
				existingStrategy.config.targetPoints = 0;
				delete (existingStrategy.config as any).targetType;
			}
			existingStrategy.config.maxPositionSize = parseInt(qty);
			existingStrategy.config.orderType = orderType.toUpperCase() as
				| "MARKET"
				| "LIMIT";
			existingStrategy.config.productType = productType.toUpperCase() as
				| "MIS"
				| "NRML"
				| "CNC";
			existingStrategy.config.quantity = parseInt(qty);
			// New intraday and risk settings
			existingStrategy.config.intradayEnabled = Boolean(intradayEnabled);
			existingStrategy.config.tradingWindowEnabled =
				Boolean(tradingWindowEnabled);
			if (tradingStartTime)
				existingStrategy.config.tradingStartTime = tradingStartTime;
			if (tradingEndTime)
				existingStrategy.config.tradingEndTime = tradingEndTime;
			if (squareOffTime) existingStrategy.config.squareOffTime = squareOffTime;
			if (trailingStopLoss !== undefined) {
				const parsedTrailing = safeParseFloat(trailingStopLoss);
				existingStrategy.config.trailingStopLoss = parsedTrailing;
			}
			if (maxRiskPerTradePercent !== undefined) {
				const parsedMaxRisk = safeParseFloat(maxRiskPerTradePercent);
				existingStrategy.config.maxRiskPerTradePercent = parsedMaxRisk;
			}

			// Update options specific fields if strategyType is options
			const isOptionsStrategy = strategyType === "options" || (existingStrategy.type as string) === "OPTIONS";
			if (isOptionsStrategy) {
				if (expiry !== undefined) {
					existingStrategy.config.expiry = expiry || undefined;
				}
				if (tradeMode !== undefined) {
					existingStrategy.config.tradeMode = (tradeMode || "atm") as "atm" | "itm" | "otm";
				}
				if (gap !== undefined) {
					existingStrategy.config.gap = gap ? safeParseFloat(gap) : undefined;
				}
			}

			await existingStrategy.save();

			logger.info(`Simple strategy updated: ${existingStrategy.name}`);

			// Log activity (non-blocking)
			try {
				await ActivityLogService.createLog({
					userId,
					type: "strategy",
					title: "Strategy Updated",
					description: `Updated strategy "${strategy}" for ${symbol.toUpperCase()}`,
					status: "success",
					metadata: {
						strategyId: existingStrategy._id,
						symbol: symbol.toUpperCase(),
					},
				});
			} catch (logError) {
				logger.error("Failed to log activity, but continuing:", logError);
			}

			const response = {
				id: existingStrategy._id,
				_id: existingStrategy._id,
				strategy,
				strategyType,
				signalsType,
				symbol: symbol.toUpperCase(),
				expiry: isOptionsStrategy 
					? (existingStrategy.config.expiry || expiry || "") 
					: "",
				tradeMode: isOptionsStrategy
					? (existingStrategy.config.tradeMode || tradeMode || "atm")
					: "atm",
				gap: isOptionsStrategy
					? (existingStrategy.config.gap?.toString() || gap || "")
					: "",
				stoploss: stoplossEnabled ? parseFloat(stoploss) : 0,
				target: targetEnabled ? parseFloat(target) : 0,
				stoplossEnabled,
				targetEnabled,
				productType: productType.toLowerCase(),
				orderType: orderType.toLowerCase(),
				qty: parseInt(qty),
				isActive: existingStrategy.isMonitoring,
				createdAt:
					existingStrategy.createdAt?.toLocaleString() ||
					new Date().toLocaleString(),
			};

			return sendSuccess(res, response, "Strategy updated successfully");
		} catch (error: unknown) {
			logger.error("Error updating simple strategy:", error);
			return sendError(res, (error as Error).message, 400);
		}
	}

	/**
	 * Delete strategy
	 * DELETE /api/strategies/:id
	 */
	public async deleteStrategy(req: Request, res: Response): Promise<Response> {
		try {
			const userId = req.user?.userId;
			if (!userId) {
				return sendError(res, "Not authorized", 401);
			}
			const { id } = req.params;

			const strategy = await Strategy.findOne({ _id: id, userId });

			if (!strategy) {
				return sendError(res, "Strategy not found", 404);
			}

			// If strategy is running, stop it first
			if (strategy.isMonitoring) {
				try {
					// Stop the strategy monitoring
					const { default: strategyMonitor } = await import(
						"../strategies/strategy-monitor"
					);
					await strategyMonitor.stopMonitoring(id);

					// Update strategy status
					strategy.isMonitoring = false;
					strategy.status = "INACTIVE";
					await strategy.save();

					logger.info(`Strategy stopped before deletion: ${strategy.name}`);
				} catch (stopError) {
					logger.warn(
						"Failed to stop strategy before deletion, continuing with deletion:",
						stopError,
					);
				}
			}

			await Strategy.findByIdAndDelete(id);

			logger.info(`Strategy deleted: ${strategy.name}`);

			// Log activity (non-blocking)
			try {
				await ActivityLogService.createLog({
					userId,
					type: "strategy",
					title: "Strategy Deleted",
					description: `Deleted strategy "${strategy.name}" for ${strategy.symbol}`,
					status: "info",
					metadata: { strategyId: id, symbol: strategy.symbol },
				});
			} catch (logError) {
				logger.error("Failed to log activity, but continuing:", logError);
			}

			return sendSuccess(res, null, "Strategy deleted successfully");
		} catch (error: unknown) {
			logger.error("Error deleting strategy:", error);
			return sendError(res, (error as Error).message, 500);
		}
	}

	/**
	 * Pause strategy
	 * POST /api/strategies/:id/pause
	 */
	public async pauseStrategy(req: Request, res: Response): Promise<Response> {
		try {
			const userId = req.user?.userId;
			const { id } = req.params;

			const strategy = await Strategy.findOne({ _id: id, userId });

			if (!strategy) {
				return sendError(res, "Strategy not found", 404);
			}

			// If strategy is already PAUSED or INACTIVE, just return success
			if (strategy.status === "PAUSED" || strategy.status === "INACTIVE") {
				return sendSuccess(
					res,
					{ strategyId: id, status: strategy.status },
					"Strategy is already paused",
				);
			}

			// Try to pause in monitor service, but if not being monitored, just update DB
			try {
				await strategyMonitor.pauseStrategy(id);
			} catch (monitorError: unknown) {
				const errorMessage = (monitorError as Error).message;
				// If strategy is not being monitored, just update the database status
				if (errorMessage.includes("not being monitored") || errorMessage.includes("not found in monitors")) {
					logger.warn(`Strategy ${id} not in monitors, updating DB status only`);
					// Continue to update DB status below
				} else {
					// Re-throw other errors
					throw monitorError;
				}
			}

			strategy.status = "PAUSED";
			strategy.isMonitoring = false;
			await strategy.save();

			// Log
			await strategyLogService.log(
				userId!,
				id,
				"info",
				"system",
				"Strategy paused",
			);

			return sendSuccess(
				res,
				{ strategyId: id, status: "PAUSED" },
				"Strategy paused successfully",
			);
		} catch (error: unknown) {
			logger.error("Error pausing strategy:", error);
			return sendError(res, (error as Error).message, 500);
		}
	}

	/**
	 * Resume strategy
	 * POST /api/strategies/:id/resume
	 */
	public async resumeStrategy(req: Request, res: Response): Promise<Response> {
		try {
			const userId = req.user?.userId;
			const { id } = req.params;

			const strategy = await Strategy.findOne({ _id: id, userId });

			if (!strategy) {
				return sendError(res, "Strategy not found", 404);
			}

			// If strategy is already ACTIVE, just return success
			if (strategy.status === "ACTIVE") {
				return sendSuccess(
					res,
					{ strategyId: id, status: "ACTIVE" },
					"Strategy is already active",
				);
			}

			// Try to resume in monitor service
			try {
				await strategyMonitor.resumeStrategy(id);
			} catch (monitorError: unknown) {
				const errorMessage = (monitorError as Error).message;
				// If strategy is not in monitors, we need to start it first
				if (errorMessage.includes("not found in monitors")) {
					logger.info(`Strategy ${id} not in monitors, starting it first`);
					// Start the strategy monitoring in LIVE mode
					const brokerStatus = await BrokerService.getBrokerStatus(userId!);
					if (!brokerStatus.isConnected || !brokerStatus.clientId) {
						return sendError(
							res,
							"Broker not connected. Please connect your broker account first to start live trading.",
							400,
						);
					}

				logger.info(`Starting strategy monitoring: LIVE trading`, {
					strategyId: id,
					mode: 'LIVE',
				});

					await strategyMonitor.startMonitoring(id);
				} else {
					// Re-throw other errors
					throw monitorError;
				}
			}

			strategy.status = "ACTIVE";
			strategy.isMonitoring = true;
			await strategy.save();

			await strategyLogService.log(
				userId!,
				id,
				"info",
				"system",
				"Strategy resumed",
			);

			return sendSuccess(
				res,
				{ strategyId: id, status: "ACTIVE" },
				"Strategy resumed successfully",
			);
		} catch (error: unknown) {
			logger.error("Error resuming strategy:", error);
			return sendError(res, (error as Error).message, 500);
		}
	}

	/**
	 * Close open position manually
	 * POST /api/strategies/:id/close-position
	 */
	public async closePosition(req: Request, res: Response): Promise<Response> {
		try {
			const userId = req.user?.userId;
			const { id } = req.params;
			const { currentPrice } = req.body;

			const strategy = await Strategy.findOne({ _id: id, userId });

			if (!strategy) {
				return sendError(res, "Strategy not found", 404);
			}

			if (!strategy.currentPosition) {
				return sendError(res, "No open position", 400);
			}

			if (!currentPrice) {
				return sendError(res, "Current price is required", 400);
			}

			await strategyMonitor.closePosition(id, currentPrice);

			return sendSuccess(res, null, "Position closed successfully");
		} catch (error: unknown) {
			logger.error("Error closing position:", error);
			return sendError(res, (error as Error).message, 500);
		}
	}

	/**
	 * Get strategy performance
	 * GET /api/strategies/:id/performance
	 */
	public async getPerformance(req: Request, res: Response): Promise<Response> {
		try {
			const userId = req.user?.userId;
			const { id } = req.params;

			const strategy = await Strategy.findOne({ _id: id, userId });

			if (!strategy) {
				return sendError(res, "Strategy not found", 404);
			}

			return sendSuccess(
				res,
				strategy.performance,
				"Performance metrics retrieved successfully",
			);
		} catch (error: unknown) {
			logger.error("Error fetching performance:", error);
			return sendError(res, (error as Error).message, 500);
		}
	}

	/**
	 * Get strategy monitor status
	 * GET /api/strategies/:id/status
	 */
	public async getMonitorStatus(
		req: Request,
		res: Response,
	): Promise<Response> {
		try {
			const userId = req.user?.userId;
			const { id } = req.params;

			const strategy = await Strategy.findOne({ _id: id, userId });

			if (!strategy) {
				return sendError(res, "Strategy not found", 404);
			}

			const status = strategyMonitor.getMonitorStatus(id);

			return sendSuccess(res, status, "Monitor status retrieved successfully");
		} catch (error: unknown) {
			logger.error("Error fetching monitor status:", error);
			return sendError(res, (error as Error).message, 500);
		}
	}

	/**
	 * Get all active monitors for user
	 * GET /api/strategies/monitors/active
	 */
	public async getActiveMonitors(
		req: Request,
		res: Response,
	): Promise<Response> {
		try {
			const userId = req.user?.userId;

			const allMonitors = strategyMonitor.getAllMonitors();

			// Filter by user
			const userMonitors = allMonitors.filter(
				(monitor: { strategy?: { userId?: { toString: () => string } } }) =>
					monitor &&
					monitor?.strategy?.userId?.toString() === userId?.toString(),
			);

			return sendSuccess(
				res,
				userMonitors,
				"Active monitors retrieved successfully",
			);
		} catch (error: unknown) {
			logger.error("Error fetching active monitors:", error);
			return sendError(res, (error as Error).message, 500);
		}
	}

	/**
	 * Start strategy monitoring
	 * POST /api/strategies/:id/start
	 */
	public async startStrategy(req: Request, res: Response): Promise<Response> {
		try {
			const userId = req.user?.userId;
			const strategyId = req.params.id;

			if (!userId) {
				return sendError(res, "Not authorized", 401);
			}

			const strategy = await Strategy.findOne({ _id: strategyId, userId });
			if (!strategy) {
				return sendError(res, "Strategy not found", 404);
			}

			// Validate broker connection for live trading (only LIVE mode supported now)
			const brokerStatus = await BrokerService.getBrokerStatus(userId);
			if (!brokerStatus.isConnected || !brokerStatus.clientId) {
				return sendError(
					res,
					"Broker not connected. Please connect your broker account first to start live trading.",
					400,
				);
			}
			logger.info(`Starting LIVE trading for strategy: ${strategy.name}`, {
				strategyId,
				userId,
				clientId: brokerStatus.clientId,
			});

			try {
				// Start monitoring the strategy in LIVE mode
				await strategyMonitor.startMonitoring(strategyId);

				// Update strategy status
				strategy.status = "ACTIVE";
				strategy.isMonitoring = true;
				await strategy.save();
			} catch (monitoringError: unknown) {
				logger.error("Error starting strategy monitoring:", monitoringError);

				// If monitoring fails, still mark as active but log the error
				strategy.status = "ACTIVE";
				strategy.isMonitoring = true;
				await strategy.save();

				// Don't throw the error, just log it and continue
				logger.warn("Strategy marked as active despite monitoring error");
			}

			// Log activity
			await ActivityLogService.createLog({
				userId,
				type: "strategy",
				title: "Strategy Started",
				description: `Started strategy "${strategy.name}" for ${strategy.symbol}`,
				status: "success",
					metadata: { strategyId, symbol: strategy.symbol },
			});

		logger.info(`Strategy started: ${strategy.name}`, {
			strategyId,
			userId,
			mode: 'LIVE',
		});
			await strategyLogService.log(
				userId!,
				strategyId,
				"info",
				"system",
				"Strategy started",
				{ mode: "LIVE" },
			);

			return sendSuccess(
				res,
				{
					strategyId,
					status: "ACTIVE",
					isMonitoring: true,
					mode: "LIVE",
				},
				"Strategy monitoring started",
			);
		} catch (error: unknown) {
			logger.error("Error starting strategy:", error);
			return sendError(
				res,
				(error as Error).message || "Failed to start strategy",
				500,
			);
		}
	}

	/**
	 * Stop strategy monitoring
	 * POST /api/strategies/:id/stop
	 */
	public async stopStrategy(req: Request, res: Response): Promise<Response> {
		try {
			const userId = req.user?.userId;
			const strategyId = req.params.id;

			if (!userId) {
				return sendError(res, "Not authorized", 401);
			}

			const strategy = await Strategy.findOne({ _id: strategyId, userId });
	
			if (!strategy) {
				return sendError(res, "Strategy not found", 404);
			}

			// Close all open positions if any
			if (strategy.currentPosition) {
				try {
					// Get current price for exit using getLiveQuotes
					const { default: marketDataService } = await import("../services/market-data.service");
					
					// Convert exchange segment string to number
					const exchangeSegmentMap: Record<string, number> = {
						'NSECM': 1,
						'NSEFO': 2,
						'NSECD': 3,
						'BSECM': 11,
						'BSEFO': 12,
						'MCXFO': 51,
					};
					const exchangeSegmentNum = exchangeSegmentMap[strategy.exchangeSegment] || 1;
					
					const quotes = await marketDataService.getLiveQuotes([
						{
							exchangeSegment: exchangeSegmentNum,
							exchangeInstrumentID: strategy.exchangeInstrumentID
						}
					]);
					
					const quote = Array.isArray(quotes) && quotes.length > 0 ? quotes[0] as any : null;
					const currentPrice = quote?.LTP || quote?.ltp || quote?.LastTradedPrice || quote?.lastTradedPrice;
					
					if (currentPrice && typeof currentPrice === 'number' && currentPrice > 0) {
						await strategyMonitor.closePosition(strategyId, currentPrice);
					}
			
				} catch (error) {
					logger.warn("Error closing position when stopping strategy", {
						strategyId,
						error: (error as Error).message,
					});
				}
			}

			// Stop monitoring the strategy
			await strategyMonitor.stopMonitoring(strategyId);

			// Update strategy status and clear position
			strategy.status = "INACTIVE";
			strategy.isMonitoring = false;
			strategy.currentPosition = undefined; // Use undefined instead of null for optional field
			await strategy.save();
	
			// Log activity
			await ActivityLogService.createLog({
				userId,
				type: "strategy",
				title: "Strategy Stopped",
				description: `Stopped strategy "${strategy.name}" for ${strategy.symbol}`,
				status: "info",
				metadata: { strategyId, symbol: strategy.symbol },
			});

			logger.info(`Strategy stopped: ${strategy.name}`, { strategyId, userId });
			await strategyLogService.log(
				userId!,
				strategyId,
				"info",
				"system",
				"Strategy stopped",
			);

			return sendSuccess(
				res,
				{
					strategyId,
					status: "INACTIVE",
					isMonitoring: false,
				},
				"Strategy monitoring stopped",
			);
		} catch (error: unknown) {
			logger.error("Error stopping strategy:", error);
			return sendError(
				res,
				(error as Error).message || "Failed to stop strategy",
				500,
			);
		}
	}

	/**
	 * Check strategy execution (manual trigger)
	 * POST /api/strategies/:id/check
	 */
	public async checkStrategyExecution(
		req: Request,
		res: Response,
	): Promise<Response> {
		try {
			const userId = req.user?.userId;
			const strategyId = req.params.id;

			if (!userId) {
				return sendError(res, "Not authorized", 401);
			}

			const strategy = await Strategy.findOne({ _id: strategyId, userId });
			if (!strategy) {
				return sendError(res, "Strategy not found", 404);
			}

			// Check strategy execution
			const result = await strategyExecutionService.checkStrategyExecution(
				strategyId,
				userId,
			);

			logger.info(`Strategy execution check: ${strategy.name}`, {
				strategyId,
				userId,
				result: {
					shouldExecute: result.shouldExecute,
					action: result.action,
					reason: result.reason,
				},
			});

			return sendSuccess(res, result, "Strategy execution checked");
		} catch (error: unknown) {
			logger.error("Error checking strategy execution:", error);
			return sendError(
				res,
				(error as Error).message || "Failed to check strategy execution",
				500,
			);
		}
	}

	/**
	 * Get all visible strategy templates for users
	 * GET /api/strategies/templates
	 */
	public async getVisibleTemplates(
		_req: Request,
		res: Response,
	): Promise<Response> {
		try {
			logger.info("Fetching visible templates...");
			
			const templates = await StrategyTemplate.find({
				isActive: true,
				isVisibleToUsers: true,
			})
				.select("name description type indicators usageCount performanceStats createdAt")
				.sort({ usageCount: -1, createdAt: -1 })
				.lean()
				.maxTimeMS(5000); // 5 second timeout

			// Convert Map to object for indicators.configurations if needed
			const formattedTemplates = templates.map((template: any) => {
				if (template.indicators?.configurations instanceof Map) {
					const configObj: Record<string, unknown> = {};
					template.indicators.configurations.forEach((value: unknown, key: string) => {
						configObj[key] = value;
					});
					template.indicators.configurations = configObj;
				}
				return template;
			});

			logger.info(`Fetched ${formattedTemplates.length} visible templates`);
			return sendSuccess(res, formattedTemplates, "Templates fetched successfully");
		} catch (error: unknown) {
			logger.error("Error fetching visible templates:", error);
			const errorMessage = error instanceof Error ? error.message : "Failed to fetch templates";
			return sendError(res, errorMessage, 500);
		}
	}

	/**
	 * Get template details with editable parameters only
	 * GET /api/strategies/templates/:id
	 */
	public async getTemplateDetailsForUser(
		req: Request,
		res: Response,
	): Promise<Response> {
		try {
			const { id } = req.params;
			const template = await StrategyTemplate.findOne({
				_id: id,
				isActive: true,
				isVisibleToUsers: true,
			}).lean();

			if (!template) {
				return sendError(res, "Template not found", 404);
			}

			// Convert Map to object and filter to show only visible parameters
			const filteredIndicators: Record<string, IndicatorConfig> = {};
			const configMap = template.indicators.configurations as IndicatorConfigMap;

			if (configMap instanceof Map) {
				for (const [key, config] of configMap.entries()) {
					if (config.isVisible) {
						filteredIndicators[key] = {
							parameters: config.parameters,
							isVisible: config.isVisible,
							isEditable: config.isEditable,
							validationRules: config.validationRules,
						};
					}
				}
			} else {
				// If already an object
				for (const [key, config] of Object.entries(configMap)) {
					if (config.isVisible) {
						filteredIndicators[key] = {
							parameters: config.parameters,
							isVisible: config.isVisible,
							isEditable: config.isEditable,
							validationRules: config.validationRules,
						};
					}
				}
			}

			logger.info(`Fetched template details: ${template.name}`);
			return sendSuccess(
				res,
				{
					...template,
					indicators: {
						enabled: template.indicators.enabled,
						configurations: filteredIndicators,
					},
				},
				"Template details fetched successfully",
			);
		} catch (error: unknown) {
			logger.error("Error fetching template details:", error);
			return sendError(res, "Failed to fetch template details", 500);
		}
	}

	/**
	 * Get instrument ID for symbol (fallback method)
	 */
	private getInstrumentId(symbol: string): number {
		const symbolMap: Record<string, number> = {
			RELIANCE: 2885633,
			TCS: 2885634,
			INFY: 2885635,
			HDFC: 2885636,
			ICICIBANK: 2885637,
			SBIN: 2885638,
			BHARTIARTL: 2885639,
			ITC: 2885640,
			KOTAKBANK: 2885641,
			LT: 2885642,
			HDFCBANK: 2885643,
			WIPRO: 2885644,
			ASIANPAINT: 2885645,
			MARUTI: 2885646,
			AXISBANK: 2885647,
			NESTLEIND: 2885648,
			ULTRACEMCO: 2885649,
			TITAN: 2885650,
			BAJFINANCE: 2885651,
			SUNPHARMA: 2885652,
			ADANIPORTS: 2885653,
			POWERGRID: 2885654,
			NTPC: 2885655,
			ONGC: 2885656,
			COALINDIA: 2885657,
			TECHM: 2885658,
			HCLTECH: 2885659,
			DRREDDY: 2885660,
		};

		return symbolMap[symbol.toUpperCase()] || 2885633; // Default to RELIANCE
	}
}

export default new StrategyController();
