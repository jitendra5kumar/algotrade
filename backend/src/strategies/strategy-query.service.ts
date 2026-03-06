import Strategy from '../models/Strategy.model';
import { Types } from 'mongoose';

/**
 * Strategy Service - Handle all strategy-related queries
 * Using toObject({ minimize: true }) to exclude empty indicator objects
 */

/**
 * Get single strategy with clean indicators
 * Removes all empty indicator objects
 */
export async function getStrategy(
  strategyId: string | Types.ObjectId
): Promise<any> {
  try {
    const strategy = await Strategy.findById(strategyId);

    if (!strategy) {
      return null;
    }

    // Remove empty objects from indicators
    const cleanStrategy = strategy.toObject({ minimize: true }) as any;

    return cleanStrategy;
  } catch (error) {
    console.error('Error fetching strategy:', error);
    throw error;
  }
}

/**
 * Get all strategies for a user with clean indicators
 */
export async function getUserStrategies(
  userId: string | Types.ObjectId
): Promise<any[]> {
  try {
    const strategies = await Strategy.find({ userId });

    // Convert all to clean objects
    const cleanStrategies = strategies.map((strategy) =>
      strategy.toObject({ minimize: true })
    ) as any[];

    return cleanStrategies;
  } catch (error) {
    console.error('Error fetching user strategies:', error);
    throw error;
  }
}

/**
 * Get active strategies for monitoring
 */
export async function getActiveStrategies(): Promise<any[]> {
  try {
    const strategies = await Strategy.find({
      status: 'ACTIVE',
      isMonitoring: true,
    });

    return strategies.map((strategy) =>
      strategy.toObject({ minimize: true })
    ) as any[];
  } catch (error) {
    console.error('Error fetching active strategies:', error);
    throw error;
  }
}

/**
 * Get strategy indicators only (clean)
 */
export async function getStrategyIndicators(
  strategyId: string | Types.ObjectId
): Promise<Record<string, any>> {
  try {
    const strategy = await Strategy.findById(strategyId);

    if (!strategy) {
      return {};
    }

    const clean = strategy.toObject({ minimize: true }) as any;

    return clean.config.indicators || {};
  } catch (error) {
    console.error('Error fetching strategy indicators:', error);
    throw error;
  }
}

/**
 * Get strategy with formatted response
 */
export async function getStrategyFormatted(
  strategyId: string | Types.ObjectId
): Promise<{
  id: string;
  name: string;
  type: string;
  status: string;
  symbol: string;
  indicators: Record<string, any>;
  indicatorCount: number;
  performance: any;
  currentPosition: any;
} | null> {
  try {
    const strategy = await Strategy.findById(strategyId);

    if (!strategy) {
      return null;
    }

    const clean = strategy.toObject({ minimize: true }) as any;
    const indicators = clean.config.indicators || {};

    return {
      id: clean._id.toString(),
      name: clean.name,
      type: clean.type,
      status: clean.status,
      symbol: clean.symbol,
      indicators,
      indicatorCount: Object.keys(indicators).length,
      performance: clean.performance,
      currentPosition: clean.currentPosition || null,
    };
  } catch (error) {
    console.error('Error formatting strategy:', error);
    throw error;
  }
}

/**
 * Get multiple strategies with pagination
 */
export async function getStrategiesWithPagination(
  userId: string | Types.ObjectId,
  limit: number = 10,
  skip: number = 0
): Promise<{
  strategies: any[];
  total: number;
  page: number;
  pages: number;
}> {
  try {
    const total = await Strategy.countDocuments({ userId });
    const strategies = await Strategy.find({ userId })
      .limit(limit)
      .skip(skip)
      .sort({ createdAt: -1 });

    const cleanStrategies = strategies.map((strategy) =>
      strategy.toObject({ minimize: true })
    ) as any[];

    return {
      strategies: cleanStrategies,
      total,
      page: Math.floor(skip / limit) + 1,
      pages: Math.ceil(total / limit),
    };
  } catch (error) {
    console.error('Error fetching strategies with pagination:', error);
    throw error;
  }
}

/**
 * Get strategy by symbol and user
 */
export async function getStrategyBySymbol(
  userId: string | Types.ObjectId,
  symbol: string
): Promise<any> {
  try {
    const strategy = await Strategy.findOne({ userId, symbol });

    if (!strategy) {
      return null;
    }

    return strategy.toObject({ minimize: true }) as any;
  } catch (error) {
    console.error('Error fetching strategy by symbol:', error);
    throw error;
  }
}

/**
 * Get strategies by type (GO_SCALP, GO_MONEY, etc.)
 */
export async function getStrategiesByType(
  userId: string | Types.ObjectId,
  type: string
): Promise<any[]> {
  try {
    const strategies = await Strategy.find({ userId, type });

    return strategies.map((strategy) =>
      strategy.toObject({ minimize: true })
    ) as any[];
  } catch (error) {
    console.error('Error fetching strategies by type:', error);
    throw error;
  }
}

/**
 * Get strategy with specific fields only (lean query with minimize)
 */
export async function getStrategyFields(
  strategyId: string | Types.ObjectId,
  fields: string[]
): Promise<any> {
  try {
    const fieldString = fields.join(' ');
    const strategy = await Strategy.findById(strategyId).select(fieldString);

    if (!strategy) {
      return null;
    }

    return strategy.toObject({ minimize: true });
  } catch (error) {
    console.error('Error fetching strategy fields:', error);
    throw error;
  }
}

/**
 * Export strategy data (for backup/export)
 */
export async function exportStrategy(
  strategyId: string | Types.ObjectId
): Promise<string> {
  try {
    const strategy = await Strategy.findById(strategyId);

    if (!strategy) {
      throw new Error('Strategy not found');
    }

    const clean = strategy.toObject({ minimize: true });

    return JSON.stringify(clean, null, 2);
  } catch (error) {
    console.error('Error exporting strategy:', error);
    throw error;
  }
}

/**
 * Batch get strategies (multiple IDs)
 */
export async function getStrategiesByIds(
  strategyIds: (string | Types.ObjectId)[]
): Promise<any[]> {
  try {
    const strategies = await Strategy.find({
      _id: { $in: strategyIds },
    });

    return strategies.map((strategy) =>
      strategy.toObject({ minimize: true })
    ) as any[];
  } catch (error) {
    console.error('Error fetching multiple strategies:', error);
    throw error;
  }
}

/**
 * Get strategy summary for dashboard
 */
export async function getStrategySummary(
  strategyId: string | Types.ObjectId
): Promise<{
  name: string;
  status: string;
  symbol: string;
  activeIndicators: string[];
  performance: any;
  lastChecked: Date | null;
} | null> {
  try {
    const strategy = await Strategy.findById(strategyId);

    if (!strategy) {
      return null;
    }

    const clean = strategy.toObject({ minimize: true }) as any;
    const activeIndicators = Object.keys(clean.config.indicators || {});

    return {
      name: clean.name,
      status: clean.status,
      symbol: clean.symbol,
      activeIndicators,
      performance: {
        winRate: clean.performance.winRate,
        netProfit: clean.performance.netProfit,
        totalTrades: clean.performance.totalTrades,
      },
      lastChecked: clean.lastCheckTime || null,
    };
  } catch (error) {
    console.error('Error getting strategy summary:', error);
    throw error;
  }
}

/**
 * Example usage in API routes
 */

/*
// GET /api/strategies/:id
export async function getStrategyRoute(req, res) {
  try {
    const { id } = req.params;
    const strategy = await getStrategy(id);
    
    if (!strategy) {
      return res.status(404).json({ error: 'Strategy not found' });
    }
    
    res.json(strategy);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// GET /api/strategies
export async function getUserStrategiesRoute(req, res) {
  try {
    const { userId } = req.user;
    const { page = 1, limit = 10 } = req.query;
    
    const result = await getStrategiesWithPagination(
      userId,
      parseInt(limit),
      (parseInt(page) - 1) * parseInt(limit)
    );
    
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// GET /api/strategies/:id/indicators
export async function getIndicatorsRoute(req, res) {
  try {
    const { id } = req.params;
    const indicators = await getStrategyIndicators(id);
    
    res.json({
      count: Object.keys(indicators).length,
      indicators,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
*/

/**
 * ==================== SAVE/CREATE/UPDATE FUNCTIONS ====================
 */

/**
 * Create a new strategy
 */
export async function createStrategy(
  userId: string | Types.ObjectId,
  strategyData: any
): Promise<any> {
  try {
    const strategy = new Strategy({
      userId,
      ...strategyData,
    });

    await strategy.save();
    return strategy.toObject({ minimize: true });
  } catch (error) {
    console.error('Error creating strategy:', error);
    throw error;
  }
}

/**
 * Update entire strategy
 */
export async function updateStrategy(
  strategyId: string | Types.ObjectId,
  updateData: any
): Promise<any> {
  try {
    console.log('strategyqueryservice',strategyId,updateData)
    const strategy = await Strategy.findByIdAndUpdate(
      strategyId,
      {
        ...updateData,
        updatedAt: new Date(),
      },
      { new: true, runValidators: true }
    );

    if (!strategy) {
      throw new Error('Strategy not found');
    }

    return strategy.toObject({ minimize: true });
  } catch (error) {
    console.error('Error updating strategy:', error);
    throw error;
  }
}

/**
 * Update only strategy config/indicators
 */
export async function updateStrategyConfig(
  strategyId: string | Types.ObjectId,
  configData: any
): Promise<any> {
  try {
    const strategy = await Strategy.findByIdAndUpdate(
      strategyId,
      {
        config: configData,
        updatedAt: new Date(),
      },
      { new: true }
    );

    if (!strategy) {
      throw new Error('Strategy not found');
    }

    return strategy.toObject({ minimize: true });
  } catch (error) {
    console.error('Error updating strategy config:', error);
    throw error;
  }
}

/**
 * Update strategy indicators only
 */
export async function updateStrategyIndicators(
  strategyId: string | Types.ObjectId,
  indicators: any
): Promise<any> {
  try {
    const strategy = await Strategy.findById(strategyId);

    if (!strategy) {
      throw new Error('Strategy not found');
    }

    strategy.config.indicators = indicators;
    strategy.updatedAt = new Date();

    await strategy.save();
    return strategy.toObject({ minimize: true });
  } catch (error) {
    console.error('Error updating indicators:', error);
    throw error;
  }
}

/**
 * Update performance metrics
 */
export async function updatePerformanceMetrics(
  strategyId: string | Types.ObjectId,
  performanceData: any
): Promise<any> {
  try {
    const strategy = await Strategy.findByIdAndUpdate(
      strategyId,
      {
        performance: {
          ...performanceData,
          lastUpdated: new Date(),
        },
        updatedAt: new Date(),
      },
      { new: true }
    );

    if (!strategy) {
      throw new Error('Strategy not found');
    }

    return strategy.toObject({ minimize: true });
  } catch (error) {
    console.error('Error updating performance metrics:', error);
    throw error;
  }
}

/**
 * Update current position
 */
export async function updateCurrentPosition(
  strategyId: string | Types.ObjectId,
  positionData: any
): Promise<any> {
  try {
    const strategy = await Strategy.findByIdAndUpdate(
      strategyId,
      {
        currentPosition: positionData || null,
        updatedAt: new Date(),
      },
      { new: true }
    );

    if (!strategy) {
      throw new Error('Strategy not found');
    }

    return strategy.toObject({ minimize: true });
  } catch (error) {
    console.error('Error updating current position:', error);
    throw error;
  }
}

/**
 * Update strategy status
 */
export async function updateStrategyStatus(
  strategyId: string | Types.ObjectId,
  status: 'ACTIVE' | 'INACTIVE' | 'PAUSED' | 'ERROR',
  errorMessage?: string
): Promise<any> {
  try {
    const updateData: any = {
      status,
      updatedAt: new Date(),
    };

    if (errorMessage) {
      updateData.lastErrorMessage = errorMessage;
    }

    const strategy = await Strategy.findByIdAndUpdate(
      strategyId,
      updateData,
      { new: true }
    );

    if (!strategy) {
      throw new Error('Strategy not found');
    }

    return strategy.toObject({ minimize: true });
  } catch (error) {
    console.error('Error updating strategy status:', error);
    throw error;
  }
}

/**
 * Update monitoring status
 */
export async function updateMonitoringStatus(
  strategyId: string | Types.ObjectId,
  isMonitoring: boolean
): Promise<any> {
  try {
    const strategy = await Strategy.findByIdAndUpdate(
      strategyId,
      {
        isMonitoring,
        lastCheckTime: isMonitoring ? new Date() : undefined,
        updatedAt: new Date(),
      },
      { new: true }
    );

    if (!strategy) {
      throw new Error('Strategy not found');
    }

    return strategy.toObject({ minimize: true });
  } catch (error) {
    console.error('Error updating monitoring status:', error);
    throw error;
  }
}

/**
 * Update last check time
 */
export async function updateLastCheckTime(
  strategyId: string | Types.ObjectId
): Promise<any> {
  try {
    const strategy = await Strategy.findByIdAndUpdate(
      strategyId,
      {
        lastCheckTime: new Date(),
        updatedAt: new Date(),
      },
      { new: true }
    );

    if (!strategy) {
      throw new Error('Strategy not found');
    }

    return strategy.toObject({ minimize: true });
  } catch (error) {
    console.error('Error updating last check time:', error);
    throw error;
  }
}

/**
 * Update indicator overrides
 */
export async function updateIndicatorOverrides(
  strategyId: string | Types.ObjectId,
  overrides: any
): Promise<any> {
  try {
    const strategy = await Strategy.findByIdAndUpdate(
      strategyId,
      {
        indicatorOverrides: overrides,
        updatedAt: new Date(),
      },
      { new: true }
    );

    if (!strategy) {
      throw new Error('Strategy not found');
    }

    return strategy.toObject({ minimize: true });
  } catch (error) {
    console.error('Error updating indicator overrides:', error);
    throw error;
  }
}

/**
 * Delete a strategy
 */
export async function deleteStrategy(
  strategyId: string | Types.ObjectId
): Promise<boolean> {
  try {
    const result = await Strategy.findByIdAndDelete(strategyId);

    if (!result) {
      throw new Error('Strategy not found');
    }

    return true;
  } catch (error) {
    console.error('Error deleting strategy:', error);
    throw error;
  }
}

/**
 * Delete multiple strategies
 */
export async function deleteStrategiesByIds(
  strategyIds: (string | Types.ObjectId)[]
): Promise<number> {
  try {
    const result = await Strategy.deleteMany({
      _id: { $in: strategyIds },
    });

    return result.deletedCount || 0;
  } catch (error) {
    console.error('Error deleting multiple strategies:', error);
    throw error;
  }
}

/**
 * Delete all strategies for a user
 */
export async function deleteUserStrategies(
  userId: string | Types.ObjectId
): Promise<number> {
  try {
    const result = await Strategy.deleteMany({ userId });

    return result.deletedCount || 0;
  } catch (error) {
    console.error('Error deleting user strategies:', error);
    throw error;
  }
}

/**
 * Bulk update strategies status
 */
export async function bulkUpdateStatus(
  strategyIds: (string | Types.ObjectId)[],
  status: 'ACTIVE' | 'INACTIVE' | 'PAUSED' | 'ERROR'
): Promise<number> {
  try {
    const result = await Strategy.updateMany(
      { _id: { $in: strategyIds } },
      {
        status,
        updatedAt: new Date(),
      }
    );

    return result.modifiedCount || 0;
  } catch (error) {
    console.error('Error bulk updating status:', error);
    throw error;
  }
}

/**
 * Clone a strategy for user
 */
export async function cloneStrategy(
  strategyId: string | Types.ObjectId,
  userId: string | Types.ObjectId,
  newName: string
): Promise<any> {
  try {
    const originalStrategy = await Strategy.findById(strategyId);

    if (!originalStrategy) {
      throw new Error('Original strategy not found');
    }

    const strategyData = originalStrategy.toObject();

    // Remove fields that should be fresh
    if ((strategyData as any)._id) delete (strategyData as any)._id;
    if ((strategyData as any).createdAt) delete (strategyData as any).createdAt;
    if ((strategyData as any).updatedAt) delete (strategyData as any).updatedAt;
    if ((strategyData as any).performance) delete (strategyData as any).performance;
    if ((strategyData as any).currentPosition) delete (strategyData as any).currentPosition;
    if ((strategyData as any).lastCheckTime) delete (strategyData as any).lastCheckTime;
    if ((strategyData as any).lastSignalTime) delete (strategyData as any).lastSignalTime;

    const clonedStrategy = new Strategy({
      ...strategyData,
      userId,
      name: newName,
      status: 'INACTIVE',
      isMonitoring: false,
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
    });

    await clonedStrategy.save();
    return clonedStrategy.toObject({ minimize: true });
  } catch (error) {
    console.error('Error cloning strategy:', error);
    throw error;
  }
}

/**
 * Save trade execution result (update performance)
 */
export async function saveTrade(
  strategyId: string | Types.ObjectId,
  tradeData: {
    isWinning: boolean;
    profitLoss: number;
  }
): Promise<any> {
  try {
    const strategy = await Strategy.findById(strategyId);

    if (!strategy) {
      throw new Error('Strategy not found');
    }

    const perf = strategy.performance;

    perf.totalTrades += 1;

    if (tradeData.isWinning) {
      perf.winningTrades += 1;
      perf.totalProfit += tradeData.profitLoss;
      perf.avgWinAmount =
        perf.totalProfit / perf.winningTrades;
    } else {
      perf.losingTrades += 1;
      perf.totalLoss += Math.abs(tradeData.profitLoss);
      perf.avgLossAmount =
        perf.totalLoss / perf.losingTrades;
    }

    perf.netProfit = perf.totalProfit - perf.totalLoss;
    perf.winRate = (perf.winningTrades / perf.totalTrades) * 100;
    perf.profitFactor =
      perf.totalProfit > 0
        ? perf.totalProfit / (perf.totalLoss || 1)
        : 0;
    perf.lastUpdated = new Date();

    strategy.performance = perf;
    strategy.updatedAt = new Date();

    await strategy.save();
    return strategy.toObject({ minimize: true });
  } catch (error) {
    console.error('Error saving trade:', error);
    throw error;
  }
}

/**
 * Reset performance metrics
 */
export async function resetPerformance(
  strategyId: string | Types.ObjectId
): Promise<any> {
  try {
    const strategy = await Strategy.findByIdAndUpdate(
      strategyId,
      {
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
        updatedAt: new Date(),
      },
      { new: true }
    );

    if (!strategy) {
      throw new Error('Strategy not found');
    }

    return strategy.toObject({ minimize: true });
  } catch (error) {
    console.error('Error resetting performance:', error);
    throw error;
  }
}

/**
 * Example API route implementations
 */

/*
// POST /api/strategies
export async function createStrategyRoute(req, res) {
  try {
    const { userId } = req.user;
    const strategyData = req.body;
    
    const strategy = await createStrategy(userId, strategyData);
    res.status(201).json(strategy);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
}

// PUT /api/strategies/:id
export async function updateStrategyRoute(req, res) {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    const strategy = await updateStrategy(id, updateData);
    res.json(strategy);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
}

// PATCH /api/strategies/:id/indicators
export async function updateIndicatorsRoute(req, res) {
  try {
    const { id } = req.params;
    const { indicators } = req.body;
    
    const strategy = await updateStrategyIndicators(id, indicators);
    res.json(strategy);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
}

// PATCH /api/strategies/:id/status
export async function updateStatusRoute(req, res) {
  try {
    const { id } = req.params;
    const { status, errorMessage } = req.body;
    
    const strategy = await updateStrategyStatus(id, status, errorMessage);
    res.json(strategy);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
}

// POST /api/strategies/:id/trades
export async function recordTradeRoute(req, res) {
  try {
    const { id } = req.params;
    const { isWinning, profitLoss } = req.body;
    
    const strategy = await saveTrade(id, { isWinning, profitLoss });
    res.json(strategy);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
}

// DELETE /api/strategies/:id
export async function deleteStrategyRoute(req, res) {
  try {
    const { id } = req.params;
    
    const deleted = await deleteStrategy(id);
    res.json({ deleted });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
}

// POST /api/strategies/:id/clone
export async function cloneStrategyRoute(req, res) {
  try {
    const { id } = req.params;
    const { userId } = req.user;
    const { newName } = req.body;
    
    const cloned = await cloneStrategy(id, userId, newName);
    res.status(201).json(cloned);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
}
*/

export default {
  // Query functions
  getStrategy,
  getUserStrategies,
  getActiveStrategies,
  getStrategyIndicators,
  getStrategyFormatted,
  getStrategiesWithPagination,
  getStrategyBySymbol,
  getStrategiesByType,
  getStrategyFields,
  exportStrategy,
  getStrategiesByIds,
  getStrategySummary,
  
  // Save/Create/Update functions
  createStrategy,
  updateStrategy,
  updateStrategyConfig,
  updateStrategyIndicators,
  updatePerformanceMetrics,
  updateCurrentPosition,
  updateStrategyStatus,
  updateMonitoringStatus,
  updateLastCheckTime,
  updateIndicatorOverrides,
  deleteStrategy,
  deleteStrategiesByIds,
  deleteUserStrategies,
  bulkUpdateStatus,
  cloneStrategy,
  saveTrade,
  resetPerformance,
};