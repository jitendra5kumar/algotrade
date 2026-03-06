import { Request, Response } from 'express';
import User from '../models/User.model';
import Strategy from '../models/Strategy.model';
import StrategyTemplate from '../models/StrategyTemplate.model';
import XtsInstrument from '../models/XtsInstrument.model';
import Trade from '../models/Trade.model';
import xtsInstrumentsService from '../services/xts-instruments.service';
import { sendSuccess, sendError } from '../utils/helpers';
import logger from '../utils/logger';
import strategyService from '../services/strategy.service';

export class AdminController {
    /**
     * Get all users with their stats
     * GET /api/admin/users
     */
    static async getAllUsers(req: Request, res: Response): Promise<Response> {
        try {
            const userId = req.user?.userId;
            if (!userId) {
                return sendError(res, 'Not authorized', 401);
            }

            // Admin role check is handled by middleware

            const users = await User.find()
                .select('-password')
                .sort({ createdAt: -1 })
                .lean();

            // Get strategy count for each user
            const usersWithStats = await Promise.all(
                users.map(async (user) => {
                    const strategies = await Strategy.find({ userId: user._id });
                    const totalStrategies = strategies.length;
                    const activeStrategies = strategies.filter(s => s.status === 'ACTIVE').length;
                    
                    // Calculate total trades (mock for now - you can add trade count to strategy model)
                    const totalTrades = strategies.reduce((sum, s) => sum + (s.performance?.totalTrades || 0), 0);

                    return {
                        id: user._id,
                        _id: user._id,
                        name: user.name,
                        email: user.email,
                        phone: user.phone || 'N/A',
                        accountType: user.accountType || 'FREE',
                        status: user.isActive === false ? 'inactive' : 'active',
                        joinDate: user.createdAt ? new Date(user.createdAt).toISOString().split('T')[0] : 'N/A',
                        totalStrategies,
                        activeStrategies,
                        totalTrades,
                        brokerConnected: user.brokerCredentials ? true : false
                    };
                })
            );

            logger.info(`Admin fetched ${usersWithStats.length} users`);
            return sendSuccess(res, usersWithStats, 'Users fetched successfully');
        } catch (error: unknown) {
            logger.error('Error fetching users for admin:', error);
            return sendError(res, (error as Error).message || 'Failed to fetch users', 500);
        }
    }

    /**
     * Get all strategies across all users
     * GET /api/admin/strategies
     */
    static async getAllStrategies(req: Request, res: Response): Promise<Response> {
        try {
            const userId = req.user?.userId;
            if (!userId) {
                return sendError(res, 'Not authorized', 401);
            }

            // Admin role check is handled by middleware

            const strategies = await Strategy.find()
                .populate('userId', 'name email')
                .sort({ createdAt: -1 })
                .lean();

            const strategiesWithDetails = strategies.map((strategy: any) => {
                const pnl = strategy.performance?.netProfit || 0;
                const totalTrades = strategy.performance?.totalTrades || 0;
                const winningTrades = strategy.performance?.winningTrades || 0;
                const winRate = totalTrades > 0 ? ((winningTrades / totalTrades) * 100).toFixed(1) : 0;

                return {
                    id: strategy._id,
                    _id: strategy._id,
                    name: strategy.name,
                    user: strategy.userId?.name || 'Unknown User',
                    userEmail: strategy.userId?.email || 'N/A',
                    symbol: strategy.symbol,
                    type: strategy.type,
                    status: strategy.status?.toLowerCase() || 'inactive',
                    isActive: strategy.status === 'ACTIVE',
                    isMonitoring: strategy.isMonitoring || false,
                    pnl: Math.round(pnl),
                    totalTrades,
                    winRate: parseFloat(winRate as string),
                    lastSignal: strategy.lastSignalTime 
                        ? getTimeAgo(new Date(strategy.lastSignalTime))
                        : strategy.lastCheckTime 
                            ? getTimeAgo(new Date(strategy.lastCheckTime))
                            : 'Never',
                    createdAt: strategy.createdAt,
                    timeframe: strategy.timeframe || '5min',
                    orderType: strategy.config?.orderType || 'MARKET',
                    productType: strategy.config?.productType || 'MIS'
                };
            });

            logger.info(`Admin fetched ${strategiesWithDetails.length} strategies`);
            return sendSuccess(res, strategiesWithDetails, 'Strategies fetched successfully');
        } catch (error: unknown) {
            logger.error('Error fetching strategies for admin:', error);
            return sendError(res, (error as Error).message || 'Failed to fetch strategies', 500);
        }
    }

    /**
     * Get admin dashboard stats
     * GET /api/admin/stats
     */
    static async getDashboardStats(req: Request, res: Response): Promise<Response> {
        try {
            const userId = req.user?.userId;
            if (!userId) {
                return sendError(res, 'Not authorized', 401);
            }

            // Total users
            const totalUsers = await User.countDocuments();
            
            // Active users (logged in last 30 days - you can customize this)
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            const activeUsers = await User.countDocuments({ 
                updatedAt: { $gte: thirtyDaysAgo }
            });

            // Total strategies
            const totalStrategies = await Strategy.countDocuments();
            
            // Active strategies
            const activeStrategies = await Strategy.countDocuments({ status: 'ACTIVE' });

            // Calculate total P&L across all strategies
            const allStrategies = await Strategy.find().lean();
            const totalPnL = allStrategies.reduce((sum, strategy) => {
                return sum + (strategy.performance?.netProfit || 0);
            }, 0);

            // Get recent users (last 7 days)
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
            const recentUsers = await User.countDocuments({ 
                createdAt: { $gte: sevenDaysAgo }
            });

            // Calculate percentage changes (mock for now)
            const stats = {
                totalUsers,
                totalUsersChange: '+12.5%',
                activeUsers,
                totalStrategies,
                activeStrategies,
                activeStrategiesChange: '+8.2%',
                totalRevenue: Math.round(totalPnL), // Using total P&L as revenue for now
                totalRevenueChange: totalPnL >= 0 ? '+15.3%' : '-5.2%',
                activeTraders: activeUsers,
                activeTradersChange: recentUsers > 0 ? `+${recentUsers}` : '-2.1%'
            };

            logger.info('Admin fetched dashboard stats');
            return sendSuccess(res, stats, 'Dashboard stats fetched successfully');
        } catch (error: unknown) {
            logger.error('Error fetching dashboard stats:', error);
            return sendError(res, (error as Error).message || 'Failed to fetch stats', 500);
        }
    }

    /**
     * Update user status (activate/deactivate)
     * PUT /api/admin/users/:userId/status
     */
    static async updateUserStatus(req: Request, res: Response): Promise<Response> {
        try {
            const adminId = req.user?.userId;
            if (!adminId) {
                return sendError(res, 'Not authorized', 401);
            }

            const { userId } = req.params;
            const { status } = req.body;

            if (!status || !['active', 'inactive'].includes(status)) {
                return sendError(res, 'Invalid status. Must be "active" or "inactive"', 400);
            }

            const user = await User.findById(userId);
            if (!user) {
                return sendError(res, 'User not found', 404);
            }

            user.isActive = status === 'active';
            await user.save();

            logger.info(`Admin ${adminId} updated user ${userId} status to ${status}`);
            return sendSuccess(res, { status: user.isActive ? 'active' : 'inactive' }, 'User status updated successfully');
        } catch (error: unknown) {
            logger.error('Error updating user status:', error);
            return sendError(res, (error as Error).message || 'Failed to update user status', 500);
        }
    }

    /**
     * Update user details
     * PUT /api/admin/users/:userId
     */
    static async updateUser(req: Request, res: Response): Promise<Response> {
        try {
            const adminId = req.user?.userId;
            if (!adminId) {
                return sendError(res, 'Not authorized', 401);
            }

            const { userId } = req.params;
            const { name, email, phone, accountType } = req.body;

            const user = await User.findById(userId);
            if (!user) {
                return sendError(res, 'User not found', 404);
            }

            // Prevent updating admin users
            if (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') {
                return sendError(res, 'Cannot update admin users', 403);
            }

            // Update fields if provided
            if (name) user.name = name;
            if (email) {
                // Check if email already exists for another user
                const existingUser = await User.findOne({ email, _id: { $ne: userId } });
                if (existingUser) {
                    return sendError(res, 'Email already in use', 400);
                }
                user.email = email;
            }
            if (phone !== undefined) user.phone = phone;
            if (accountType && ['FREE', 'BASIC', 'PREMIUM', 'ENTERPRISE'].includes(accountType)) {
                user.accountType = accountType;
            }

            await user.save();

            logger.info(`Admin ${adminId} updated user ${userId}`);
            return sendSuccess(res, { user }, 'User updated successfully');
        } catch (error: unknown) {
            logger.error('Error updating user:', error);
            return sendError(res, (error as Error).message || 'Failed to update user', 500);
        }
    }

    /**
     * Delete user
     * DELETE /api/admin/users/:userId
     */
    static async deleteUser(req: Request, res: Response): Promise<Response> {
        try {
            const adminId = req.user?.userId;
            if (!adminId) {
                return sendError(res, 'Not authorized', 401);
            }

            const { userId } = req.params;

            const user = await User.findById(userId);
            if (!user) {
                return sendError(res, 'User not found', 404);
            }

            // Prevent deleting admin users
            if (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') {
                return sendError(res, 'Cannot delete admin users', 403);
            }

            // Delete user's strategies and trades (cascade delete)
            await Strategy.deleteMany({ userId });
            await Trade.deleteMany({ userId });

            // Delete the user
            await User.findByIdAndDelete(userId);

            logger.info(`Admin ${adminId} deleted user ${userId}`);
            return sendSuccess(res, {}, 'User deleted successfully');
        } catch (error: unknown) {
            logger.error('Error deleting user:', error);
            return sendError(res, (error as Error).message || 'Failed to delete user', 500);
        }
    }

    /**
     * Toggle strategy status
     * PUT /api/admin/strategies/:strategyId/toggle
     */
    static async toggleStrategy(req: Request, res: Response): Promise<Response> {
        try {
            const adminId = req.user?.userId;
            if (!adminId) {
                return sendError(res, 'Not authorized', 401);
            }

            const { strategyId } = req.params;

            const strategy = await Strategy.findById(strategyId);
            if (!strategy) {
                return sendError(res, 'Strategy not found', 404);
            }

            // Toggle between ACTIVE and PAUSED
            if (strategy.status === 'ACTIVE') {
                strategy.status = 'PAUSED';
                strategy.isMonitoring = false;
            } else {
                strategy.status = 'ACTIVE';
                strategy.isMonitoring = true;
            }

            await strategy.save();

            logger.info(`Admin ${adminId} toggled strategy ${strategyId} to ${strategy.status}`);
            return sendSuccess(
                res, 
                { 
                    status: strategy.status.toLowerCase(),
                    isActive: strategy.status === 'ACTIVE' 
                }, 
                `Strategy ${strategy.status === 'ACTIVE' ? 'activated' : 'paused'} successfully`
            );
        } catch (error: unknown) {
            logger.error('Error toggling strategy:', error);
            return sendError(res, (error as Error).message || 'Failed to toggle strategy', 500);
        }
    }

    /**
     * Get all strategy templates
     * GET /api/admin/strategy-templates
     */
    static async getStrategyTemplates(req: Request, res: Response): Promise<Response> {
        try {
            const userId = req.user?.userId;
            if (!userId) {
                return sendError(res, 'Not authorized', 401);
            }

            const { filter = 'ALL' } = req.query;

            const query: any = {};
            if (filter === 'CUSTOM') query.type = 'CUSTOM';
            if (filter === 'ACTIVE') query.isActive = true;

            const templates = await StrategyTemplate.find(query)
                .populate('createdBy', 'name email')
                .sort({ createdAt: -1 })
                .lean();

            logger.info(`Admin fetched ${templates.length} strategy templates`);
            return sendSuccess(res, templates, 'Strategy templates fetched successfully');
        } catch (error: unknown) {
            logger.error('Error fetching strategy templates:', error);
            return sendError(res, (error as Error).message || 'Failed to fetch strategy templates', 500);
        }
    }

    /**
     * Create strategy template
     * POST /api/admin/strategy-templates
     */
    static async createStrategyTemplate(req: Request, res: Response): Promise<Response> {
        try {
            const userId = req.user?.userId;
            if (!userId) {
                return sendError(res, 'Not authorized', 401);
            }

            const { name, description, type, tags, indicators, isVisibleToUsers } = req.body;

            if (!name || !type || !tags || !indicators) {
                return sendError(res, 'Name, type, tags, and indicators are required', 400);
            }

            const template = await StrategyTemplate.create({
                name,
                description,
                type,
                tags,
                createdBy: userId,
                isVisibleToUsers: isVisibleToUsers ?? true,
                indicators
            });

            logger.info(`Admin ${userId} created strategy template ${template._id}`);
            return sendSuccess(res, template, 'Strategy template created successfully');
        } catch (error: unknown) {
            logger.error('Error creating strategy template:', error);
            return sendError(res, (error as Error).message || 'Failed to create strategy template', 500);
        }
    }

    /**
     * Get strategy template details
     * GET /api/admin/strategy-templates/:id
     */
    static async getStrategyTemplateDetails(req: Request, res: Response): Promise<Response> {
        try {
            const userId = req.user?.userId;
            if (!userId) {
                return sendError(res, 'Not authorized', 401);
            }

            const { id } = req.params;
            const template = await StrategyTemplate.findById(id);
            
            if (!template) {
                return sendError(res, 'Strategy template not found', 404);
            }

            const strategies = await Strategy.find({ templateId: id });

            return sendSuccess(res, {
                template,
                usageCount: strategies.length,
                strategies: strategies.map(s => ({
                    id: s._id,
                    name: s.name,
                    status: s.status,
                    userId: s.userId
                }))
            }, 'Strategy template details fetched successfully');
        } catch (error: unknown) {
            logger.error('Error fetching strategy template details:', error);
            return sendError(res, (error as Error).message || 'Failed to fetch strategy template details', 500);
        }
    }

    /**
     * Update strategy template
     * PUT /api/admin/strategy-templates/:id
     */
    static async updateStrategyTemplate(req: Request, res: Response): Promise<Response> {
        try {
            const userId = req.user?.userId;
            if (!userId) {
                return sendError(res, 'Not authorized', 401);
            }

            const { id } = req.params;
            const updates = req.body;

            const template = await StrategyTemplate.findByIdAndUpdate(id, updates, { new: true });


            
            if (!template) {
                return sendError(res, 'Strategy template not found', 404);
            }

            if (template && template.isActive && template.isVisibleToUsers) {
                const activeStrategies = await Strategy.find({
                    templateId: id
                });
                const configMap = template.indicators.configurations as any;

                for (const strategy of activeStrategies) {
                    try{
                        await strategyService.updateStrategyIndicators(strategy,configMap);
                    }catch(error){
                        logger.error(`Error updating strategy indicators for strategy with id:${strategy.id}`, error);
                    }
                    
                }
            }
            

            logger.info(`Admin ${userId} updated strategy template ${id}`);
            return sendSuccess(res, template, 'Strategy template updated successfully');
        } catch (error: unknown) {
            logger.error('Error updating strategy template:', error);
            return sendError(res, (error as Error).message || 'Failed to update strategy template', 500);
        }
    }

    /**
     * Delete strategy template
     * DELETE /api/admin/strategy-templates/:id
     */
    static async deleteStrategyTemplate(req: Request, res: Response): Promise<Response> {
        try {
            const userId = req.user?.userId;
            if (!userId) {
                return sendError(res, 'Not authorized', 401);
            }

            const { id } = req.params;

            const activeStrategies = await Strategy.countDocuments({
                templateId: id,
                status: 'ACTIVE'
            });

            if (activeStrategies > 0) {
                return sendError(
                    res,
                    `Cannot delete: ${activeStrategies} active strategies using this template`,
                    400
                );
            }

            // Hard delete instead of soft delete
            await StrategyTemplate.findByIdAndDelete(id);

            logger.info(`Admin ${userId} deleted strategy template ${id}`);
            return sendSuccess(res, null, 'Strategy template deleted successfully');
        } catch (error: unknown) {
            logger.error('Error deleting strategy template:', error);
            return sendError(res, (error as Error).message || 'Failed to delete strategy template', 500);
        }
    }

    /**
     * Clone strategy template
     * POST /api/admin/strategy-templates/:id/clone
     */
    static async cloneStrategyTemplate(req: Request, res: Response): Promise<Response> {
        try {
            const userId = req.user?.userId;
            if (!userId) {
                return sendError(res, 'Not authorized', 401);
            }

            const { id } = req.params;
            const { name } = req.body;

            const original = await StrategyTemplate.findById(id);
            if (!original) {
                return sendError(res, 'Strategy template not found', 404);
            }

            const cloned = await StrategyTemplate.create({
                ...original.toObject(),
                _id: undefined,
                name: name || `${original.name} (Copy)`,
                createdBy: userId,
                usageCount: 0
            });

            logger.info(`Admin ${userId} cloned strategy template ${id}`);
            return sendSuccess(res, cloned, 'Strategy template cloned successfully');
        } catch (error: unknown) {
            logger.error('Error cloning strategy template:', error);
            return sendError(res, (error as Error).message || 'Failed to clone strategy template', 500);
        }
    }

    /**
     * Toggle indicator parameter visibility
     * PUT /api/admin/strategy-templates/:id/indicators/:indicator/visibility
     */
    static async toggleIndicatorParameterVisibility(req: Request, res: Response): Promise<Response> {
        try {
            const userId = req.user?.userId;
            if (!userId) {
                return sendError(res, 'Not authorized', 401);
            }

            const { id, indicator } = req.params;
            const { isVisible, isEditable } = req.body;

            const template = await StrategyTemplate.findById(id);
            if (!template) {
                return sendError(res, 'Strategy template not found', 404);
            }

            // Update the configurations Map directly
            const config = (template.indicators.configurations as any).get(indicator);
            if (!config) {
                return sendError(res, 'Indicator not found in template', 404);
            }

            config.isVisible = isVisible;
            config.isEditable = isEditable;
            (template.indicators.configurations as any).set(indicator, config);
            await template.save();

            logger.info(`Admin ${userId} updated indicator visibility for ${indicator} in template ${id}`);
            return sendSuccess(res, template, 'Indicator visibility updated successfully');
        } catch (error: unknown) {
            logger.error('Error updating indicator visibility:', error);
            return sendError(res, (error as Error).message || 'Failed to update indicator visibility', 500);
        }
    }

    /**
     * Get all instruments with pagination
     * GET /api/admin/instruments
     */
    static async getAllInstruments(req: Request, res: Response): Promise<Response> {
        try {
            const userId = req.user?.userId;
            if (!userId) {
                return sendError(res, 'Not authorized', 401);
            }

            const { page = 1, limit = 50, exchange, search, instrumentType } = req.query;

            const query: any = {};
            if (exchange) query.exchangeSegment = exchange;
            if (instrumentType) query.series = instrumentType;
            if (search) {
                const searchStr = String(search);
                const isNumber = !isNaN(Number(searchStr)) && searchStr.trim() !== '';
                
                // Build search conditions
                const searchConditions: any[] = [
                    { name: { $regex: search, $options: 'i' } },
                    { description: { $regex: search, $options: 'i' } }
                ];
                
                // If search is a number, also search by exchangeInstrumentID
                if (isNumber) {
                    const searchNum = Number(searchStr);
                    searchConditions.push({ exchangeInstrumentID: searchNum });
                }
                
                // Check if search matches exchange segment names
                const exchangeSegmentMap: Record<string, number> = {
                    'NSECM': 1,
                    'NSEFO': 2,
                    'NSECD': 3,
                    'BSECM': 11,
                    'BSEFO': 12,
                    'MCXFO': 51
                };
                
                const upperSearch = searchStr.toUpperCase().trim();
                if (exchangeSegmentMap[upperSearch]) {
                    searchConditions.push({ exchangeSegment: exchangeSegmentMap[upperSearch] });
                }
                
                query.$or = searchConditions;
            }

            const instruments = await XtsInstrument.find(query)
                .limit(parseInt(limit as string) * 1)
                .skip((parseInt(page as string) - 1) * parseInt(limit as string))
                .sort({ name: 1 })
                .lean();

            const total = await XtsInstrument.countDocuments(query);

            logger.info(`Admin fetched ${instruments.length} instruments`);
            return sendSuccess(res, {
                instruments,
                pagination: {
                    total,
                    page: parseInt(page as string),
                    limit: parseInt(limit as string),
                    totalPages: Math.ceil(total / parseInt(limit as string))
                }
            }, 'Instruments fetched successfully');
        } catch (error: unknown) {
            logger.error('Error fetching instruments:', error);
            return sendError(res, (error as Error).message || 'Failed to fetch instruments', 500);
        }
    }

    /**
     * Search instruments (autocomplete)
     * GET /api/admin/instruments/search
     */
    static async searchInstruments(req: Request, res: Response): Promise<Response> {
        try {
            const userId = req.user?.userId;
            if (!userId) {
                return sendError(res, 'Not authorized', 401);
            }

            const { q, limit = 20, exchange, instrumentType } = req.query;

            if (!q || (q as string).length < 2) {
                return sendError(res, 'Search query must be at least 2 characters', 400);
            }

            const searchStr = String(q);
            const isNumber = !isNaN(Number(searchStr)) && searchStr.trim() !== '';
            
            // Build search conditions
            const searchConditions: any[] = [
                { name: { $regex: q, $options: 'i' } },
                { description: { $regex: q, $options: 'i' } },
            ];
            
            // If search query is a number, also search by exchangeInstrumentID
            if (isNumber) {
                const searchNum = Number(searchStr);
                searchConditions.push({ exchangeInstrumentID: searchNum });
            }
            
            // Check if search matches exchange segment names
            const exchangeSegmentMap: Record<string, number> = {
                'NSECM': 1,
                'NSEFO': 2,
                'NSECD': 3,
                'BSECM': 11,
                'BSEFO': 12,
                'MCXFO': 51
            };
            
            const upperSearch = searchStr.toUpperCase().trim();
            if (exchangeSegmentMap[upperSearch]) {
                searchConditions.push({ exchangeSegment: exchangeSegmentMap[upperSearch] });
            }
            
            const query: any = {
                $or: searchConditions,
            };

            if (exchange) {
                query.exchangeSegment = Number(exchange);
            }

            if (instrumentType) {
                query.series = instrumentType;
            }

            const instruments = await XtsInstrument.find(query)
                .limit(parseInt(limit as string))
                .select(
                    'name description exchangeSegment exchangeInstrumentID instrumentToken lotSize tickSize expiry series instrumentType contractExpiration optionType createdAt updatedAt'
                )
                .lean();

            return sendSuccess(res, instruments, 'Instruments search results');
        } catch (error: unknown) {
            logger.error('Error searching instruments:', error);
            return sendError(res, (error as Error).message || 'Failed to search instruments', 500);
        }
    }

    /**
     * Get instrument statistics
     * GET /api/admin/instruments/stats
     */
    static async getInstrumentStats(req: Request, res: Response): Promise<Response> {
        try {
            const userId = req.user?.userId;
            if (!userId) {
                return sendError(res, 'Not authorized', 401);
            }

            const [totalInstruments, byExchange, byType, lastUpdated] = await Promise.all([
                XtsInstrument.countDocuments(),
                XtsInstrument.aggregate([
                    { $group: { _id: '$exchangeSegment', count: { $sum: 1 } } }
                ]),
                XtsInstrument.aggregate([
                    { $group: { _id: '$series', count: { $sum: 1 } } }
                ]),
                XtsInstrument.findOne().sort({ updatedAt: -1 }).select('updatedAt')
            ]);

            return sendSuccess(res, {
                totalInstruments,
                byExchange,
                byType,
                lastUpdated: lastUpdated?.updatedAt
            }, 'Instrument stats fetched successfully');
        } catch (error: unknown) {
            logger.error('Error fetching instrument stats:', error);
            return sendError(res, (error as Error).message || 'Failed to fetch instrument stats', 500);
        }
    }

    /**
     * Get instrument details
     * GET /api/admin/instruments/:instrumentId
     */
    static async getInstrumentDetails(req: Request, res: Response): Promise<Response> {
        try {
            const userId = req.user?.userId;
            if (!userId) {
                return sendError(res, 'Not authorized', 401);
            }

            const { instrumentId } = req.params;
            const instrument = await XtsInstrument.findById(instrumentId);
            
            if (!instrument) {
                return sendError(res, 'Instrument not found', 404);
            }

            const usageCount = await Strategy.countDocuments({
                exchangeInstrumentID: instrument.exchangeInstrumentID
            });

            const strategies = await Strategy.find({
                exchangeInstrumentID: instrument.exchangeInstrumentID
            })
            .select('name status type userId')
            .populate('userId', 'name email')
            .limit(10);

            return sendSuccess(res, {
                instrument: instrument.toObject(),
                usageCount,
                usedInStrategies: strategies
            }, 'Instrument details fetched successfully');
        } catch (error: unknown) {
            logger.error('Error fetching instrument details:', error);
            return sendError(res, (error as Error).message || 'Failed to fetch instrument details', 500);
        }
    }

    /**
     * Update all instruments
     * POST /api/admin/instruments/update-all
     */
    static async updateAllInstruments(req: Request, res: Response): Promise<Response> {
        try {
            const userId = req.user?.userId;
            if (!userId) {
                return sendError(res, 'Not authorized', 401);
            }

            logger.info(`Admin ${userId} triggered instruments update`);

            const result = await xtsInstrumentsService.updateAllInstruments();

            logger.info(`Instruments update completed. Inserted: ${result.totalInserted}, Errors: ${result.totalErrors}`);
            return sendSuccess(res, result, 'Instruments updated successfully');
        } catch (error: unknown) {
            logger.error('Error updating instruments:', error);
            return sendError(res, (error as Error).message || 'Failed to update instruments', 500);
        }
    }

    /**
     * Toggle strategy visibility for all users
     * PUT /api/admin/strategy-template/:strategyId/visibility
     */
    static async toggleStrategyVisibility(req: Request, res: Response): Promise<Response> {
        try {
            const userId = req.user?.userId;
            if (!userId) {
                return sendError(res, 'Not authorized', 401);
            }

            const { strategyId } = req.params;
            const { isVisible } = req.body;

            if (typeof isVisible !== 'boolean') {
                return sendError(res, 'Invalid visibility value', 400);
            }

            // Find the strategy to get its name and type
            const strategy = await Strategy.findById(strategyId);
            if (!strategy) {
                return sendError(res, 'Strategy not found', 404);
            }

            // Update all strategies with same name and type
            const result = await Strategy.updateMany(
                {
                    name: strategy.name,
                    type: strategy.type
                },
                {
                    $set: { isVisibleToUsers: isVisible }
                }
            );

            logger.info(`Admin ${userId} set visibility of "${strategy.name}" (${strategy.type}) to ${isVisible}. Updated ${result.modifiedCount} strategies`);
            
            return sendSuccess(
                res,
                { 
                    isVisible, 
                    updatedCount: result.modifiedCount 
                },
                `Strategy visibility updated successfully`
            );
        } catch (error: unknown) {
            logger.error('Error toggling strategy visibility:', error);
            return sendError(res, (error as Error).message || 'Failed to toggle visibility', 500);
        }
    }

    /**
     * Get all trades across all users (Admin)
     * GET /api/admin/trades
     */
    static async getAllTrades(req: Request, res: Response): Promise<Response> {
        try {
            const userId = req.user?.userId;
            if (!userId) {
                return sendError(res, 'Not authorized', 401);
            }

            const { 
                status, 
                symbol, 
                userId: filterUserId,
                strategyId,
                page = 1, 
                limit = 50,
                sortBy = 'createdAt',
                order = 'desc'
            } = req.query;

            // Build filter - no userId restriction for admin
            const filter: Record<string, unknown> = {};
            if (status) filter.status = status;
            if (symbol) filter.symbol = symbol;
            if (filterUserId) filter.userId = filterUserId;
            if (strategyId) filter.strategyId = strategyId;

            // Pagination
            const skip = (Number(page) - 1) * Number(limit);
            const sortOrder = order === 'desc' ? -1 : 1;

            // Fetch trades with populated user and strategy info
            const trades = await Trade.find(filter)
                .sort({ [sortBy as string]: sortOrder })
                .skip(skip)
                .limit(Number(limit))
                .populate('userId', 'name email')
                .populate('strategyId', 'name type');

            // Get total count
            const total = await Trade.countDocuments(filter);

            logger.info(`Admin ${userId} fetched ${trades.length} trades`);
            return sendSuccess(res, {
                trades,
                pagination: {
                    page: Number(page),
                    limit: Number(limit),
                    total,
                    pages: Math.ceil(total / Number(limit)),
                },
            }, 'Trades retrieved successfully');
        } catch (error: unknown) {
            logger.error('Error fetching trades for admin:', error);
            return sendError(res, (error as Error).message || 'Failed to fetch trades', 500);
        }
    }
}

// Helper function to calculate time ago
function getTimeAgo(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
}

