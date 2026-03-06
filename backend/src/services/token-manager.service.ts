import User from '../models/User.model';
import dealerApiService from './dealer-api.service';
import marketDataService from './market-data.service';
import logger from '../utils/logger';

interface TokenStatus {
    brokerToken: {
        isActive: boolean;
        token: string | null;
        expiry: Date | null;
        lastRefresh: Date | null;
    };
    marketDataToken: {
        isActive: boolean;
        token: string | null;
        expiry: Date | null;
        lastRefresh: Date | null;
    };
}

class TokenManagerService {
    /**
     * Get comprehensive token status for a user
     */
    public async getTokenStatus(userId: string): Promise<TokenStatus> {
        try {
            const user = await User.findById(userId);
            if (!user) {
                throw new Error('User not found');
            }

            // Get broker token status
            const brokerTokenStatus = await this.getBrokerTokenStatus(user as any);
            
            // Get market data token status
            const marketDataTokenStatus = await this.getMarketDataTokenStatus();

            return {
                brokerToken: brokerTokenStatus,
                marketDataToken: marketDataTokenStatus
            };
		} catch (error: unknown) {
            logger.error('Error getting token status:', error);
            throw error;
        }
    }

    /**
     * Get broker token status
     */
    private async getBrokerTokenStatus(user: { _id: string; brokerCredentials?: { token?: string; tokenGeneratedAt?: Date; isConnected?: boolean } }): Promise<{ isActive: boolean; token: string | null; expiry: Date | null; lastRefresh: Date | null }> {
        try {
            // Check if we have stored token info
            const storedToken = user.brokerCredentials?.token;
            const tokenGeneratedAt = user.brokerCredentials?.tokenGeneratedAt;
            const isConnected = user.brokerCredentials?.isConnected;

            if (!isConnected || !storedToken || !tokenGeneratedAt) {
                return {
                    isActive: false,
                    token: null,
                    expiry: null,
                    lastRefresh: null
                };
            }

            // Check if token is still valid (24 hours) - but DON'T auto-refresh
            const tokenAge = Date.now() - new Date(tokenGeneratedAt).getTime();
            const isExpired = tokenAge > 24 * 60 * 60 * 1000; // 24 hours

            if (isExpired) {
                // Return expired status but DON'T auto-refresh
                logger.warn('Broker token is expired but not auto-refreshing:', { userId: user._id });
                return {
                    isActive: false,
                    token: storedToken,
                    expiry: new Date(new Date(tokenGeneratedAt).getTime() + 24 * 60 * 60 * 1000),
                    lastRefresh: new Date(tokenGeneratedAt)
                };
            }

            return {
                isActive: true,
                token: storedToken,
                expiry: new Date(new Date(tokenGeneratedAt).getTime() + 24 * 60 * 60 * 1000),
                lastRefresh: new Date(tokenGeneratedAt)
            };
		} catch (error: unknown) {
            logger.error('Error getting broker token status:', error);
            return {
                isActive: false,
                token: null,
                expiry: null,
                lastRefresh: null
            };
        }
    }

    /**
     * Get market data token status
     */
    private async getMarketDataTokenStatus(): Promise<{ isActive: boolean; token: string | null; expiry: Date | null; lastRefresh: Date | null }> {
        try {
            const tokenStatus = marketDataService.getTokenStatus();
            
            if (!tokenStatus) {
                return {
                    isActive: false,
                    token: null,
                    expiry: null,
                    lastRefresh: null
                };
            }

            return {
                isActive: tokenStatus.isActive,
                token: tokenStatus.token,
                expiry: tokenStatus.expiry,
                lastRefresh: tokenStatus.lastRefresh
            };
		} catch (error: unknown) {
            logger.error('Error getting market data token status:', error);
            return {
                isActive: false,
                token: null,
                expiry: null,
                lastRefresh: null
            };
        }
    }

    /**
     * Update broker token in database
     */
    public async updateBrokerToken(userId: string, token: string): Promise<void> {
        try {
            await User.findByIdAndUpdate(userId, {
                $set: {
                    'brokerCredentials.token': token,
                    'brokerCredentials.tokenGeneratedAt': new Date(),
                    'brokerCredentials.isConnected': true,
                    'brokerCredentials.connectedAt': new Date()
                }
            });

            logger.info(`Broker token updated for user: ${userId}`);
		} catch (error: unknown) {
            logger.error('Error updating broker token:', error);
            throw error;
        }
    }

    /**
     * Update market data token in database
     */
    public async updateMarketDataToken(userId: string, token: string, expiry: Date): Promise<void> {
        try {
            await User.findByIdAndUpdate(userId, {
                $set: {
                    'marketDataCredentials.token': token,
                    'marketDataCredentials.expiry': expiry,
                    'marketDataCredentials.lastRefresh': new Date(),
                    'marketDataCredentials.isActive': true,
                    'marketDataCredentials.connectedAt': new Date()
                }
            });

            logger.info(`Market data token updated for user: ${userId}`);
		} catch (error: unknown) {
            logger.error('Error updating market data token:', error);
            throw error;
        }
    }

    /**
     * Refresh broker token
     */
    public async refreshBrokerToken(userId: string): Promise<string> {
        try {
            const newToken = await dealerApiService.login();
            await this.updateBrokerToken(userId, newToken);
            return newToken;
		} catch (error: unknown) {
            logger.error('Error refreshing broker token:', error);
            throw error;
        }
    }

    /**
     * Refresh market data token
     */
    public async refreshMarketDataToken(userId: string): Promise<string> {
        try {
            const newToken = await marketDataService.getMarketDataToken();
            const expiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
            await this.updateMarketDataToken(userId, newToken, expiry);
            return newToken;
		} catch (error: unknown) {
            logger.error('Error refreshing market data token:', error);
            throw error;
        }
    }

    /**
     * Clear all tokens for a user
     */
    public async clearAllTokens(userId: string): Promise<void> {
        try {
            await User.findByIdAndUpdate(userId, {
                $set: {
                    'brokerCredentials.token': '',
                    'brokerCredentials.tokenGeneratedAt': null,
                    'brokerCredentials.isConnected': false,
                    'brokerCredentials.connectedAt': null,
                    'marketDataCredentials.token': '',
                    'marketDataCredentials.expiry': null,
                    'marketDataCredentials.lastRefresh': null,
                    'marketDataCredentials.isActive': false,
                    'marketDataCredentials.connectedAt': null
                }
            });

            logger.info(`All tokens cleared for user: ${userId}`);
		} catch (error: unknown) {
            logger.error('Error clearing tokens:', error);
            throw error;
        }
    }
}

export default new TokenManagerService();
