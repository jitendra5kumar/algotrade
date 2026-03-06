import axios, { AxiosInstance } from 'axios';
import config from '../config/environment';
import logger from '../utils/logger';

// Helper type for axios errors
type AxiosError = {
    response?: {
        status?: number;
        statusText?: string;
        data?: {
            description?: string;
            message?: string;
        };
    };
    message?: string;
    config?: {
        url?: string;
        method?: string;
    };
};

interface DealerLoginResponse {
    type: string;
    code: string;
    description: string;
    result: {
        token: string;
        userID: string;
        isInvestorClient: boolean;
    };
}


class DealerApiService {
    private apiClient: AxiosInstance;
    private sessionToken: string | null = null;
    private tokenExpiry: Date | null = null;

    constructor() {
        this.apiClient = axios.create({
            baseURL: config.DEALER_API_BASE_URL,
            timeout: 30000,
            headers: {
                'Content-Type': 'application/json',
            },
        });

        // Response interceptor for logging
        this.apiClient.interceptors.response.use(
            (response) => {
                logger.info('Dealer API Response:', {
                    url: response.config.url,
                    status: response.status,
                    data: response.data,
                });
                return response;
            },
            (error) => {
                logger.error('Dealer API Error:', {
                    url: error.config?.url,
                    status: error.response?.status,
                    data: error.response?.data,
                    message: error.message,
                });
                throw error;
            }
        );
    }

    /**
     * Login to dealer API and get session token
     */
    public async login(): Promise<string> {
        try {
            const loginPayload = {
                secretKey: config.INTERACTIVE_API_SECRET,
                appKey: config.INTERACTIVE_API_KEY,
                source: config.INTERACTIVE_SOURCE,
            };

            logger.info('Dealer API login attempt', {
                url: `${config.DEALER_API_BASE_URL}/interactive/user/session`,
                payload: {
                    appKey: loginPayload.appKey,
                    secretKey: loginPayload.secretKey?.substring(0, 4) + '***',
                    source: loginPayload.source
                }
            });
            console.log(loginPayload.secretKey?.substring(0, 4) + '***')
            const response = await this.apiClient.post<DealerLoginResponse>(
                '/interactive/user/session',
                loginPayload
            );
            console.log('dealer response',response.data)
            if (response.data && response.data.result && response.data.result.token) {
                this.sessionToken = response.data.result.token;
                // Token expires in 24 hours (adjust as per actual API)
                this.tokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

                logger.info('Dealer API login successful', {
                    userID: response.data.result.userID,
                    hasToken: !!this.sessionToken
                });

                return this.sessionToken;
            }

            throw new Error('Failed to get session token from dealer API');
		} catch (error: unknown) {
            const errorObj = error as AxiosError;
            logger.error('Dealer API login failed:', {
                status: errorObj.response?.status,
                statusText: errorObj.response?.statusText,
                data: errorObj.response?.data,
                message: errorObj.message,
                url: errorObj.config?.url,
                method: errorObj.config?.method,
            });
            
            // Return a more specific error message
            if (errorObj.response?.status === 400) {
                throw new Error('Invalid API credentials. Please check INTERACTIVE_API_SECRET and INTERACTIVE_API_KEY in environment variables.');
            }
            
            const errorMessage = errorObj.response?.data?.description || 
                                errorObj.response?.data?.message || 
                                errorObj.message || 
                                'Dealer API login failed';
            
            throw new Error(errorMessage);
        }
    }

    /**
     * Get current session token (auto-login if expired)
     */
    public async getToken(): Promise<string> {
        if (!this.sessionToken || !this.tokenExpiry || new Date() >= this.tokenExpiry) {
            logger.info('Session token expired or not found, logging in...');
            try {
                await this.login();
            } catch (error) {
                logger.error('Failed to get token - login error:', {
                    error: error instanceof Error ? error.message : String(error),
                    stack: error instanceof Error ? error.stack : undefined
                });
                throw new Error('Token/Authorization not found - Unable to login to dealer API');
            }
            
            // Critical check: Ensure token was actually set after login
            if (!this.sessionToken) {
                logger.error('Login succeeded but no token received');
                throw new Error('Token/Authorization not found - Login succeeded but no token received');
            }
        }
        return this.sessionToken;
    }


    /**
     * Cancel All Orders
     */
    public async cancelAllOrders(params: {
        exchangeSegment: string;
        exchangeInstrumentID: number;
        clientID: string;
    }): Promise<Record<string, unknown>> {
        try {
            const token = await this.getToken();

            logger.info('Cancelling all orders:', params);

            const response = await this.apiClient.post(
                '/interactive/orders/cancelall',
                params,
                {
                    headers: {
                        Authorization: token,
                    },
                }
            );

            logger.info('All orders cancelled successfully:', response.data);
            return response.data;
		} catch (error: unknown) {
            const errorObj = error as AxiosError;
            logger.error('Error cancelling all orders:', error);
            throw new Error(errorObj.response?.data?.description || 'Failed to cancel all orders');
        }
    }

    /**
     * Get Dealer Positions
     */
    public async getPositions(clientID: string, dayOrNet: string = 'NetWise'): Promise<Record<string, unknown>> {
        try {
            const token = await this.getToken();

            logger.info('Fetching positions:', { clientID, dayOrNet });

            const response = await this.apiClient.get(
                `/interactive/portfolio/dealerpositions?dayOrNet=${dayOrNet}&clientID=${clientID}`,
                {
                    headers: {
                        Authorization: token,
                    },
                }
            );

            logger.info('Positions fetched successfully');
            return response.data;
		} catch (error: unknown) {
            const errorObj = error as AxiosError;
            logger.error('Error fetching positions:', error);
            throw new Error(errorObj.response?.data?.description || 'Failed to fetch positions');
        }
    }

    /**
     * Get TradeBook (Dealer API)
     * GET /interactive/orders/dealertradebook?clientID=ON190
     */
    public async getTradeBook(clientID: string): Promise<Record<string, unknown>> {
        let token: string | null = null;
        try {
            token = await this.getToken();

            logger.info('Fetching dealer tradebook:', { clientID });

            // Use dealer tradebook API directly as per documentation
            const response = await this.apiClient.get(
                `/interactive/orders/dealertradebook?clientID=${clientID}`,
                {
                    headers: {
                        Authorization: token,
                    },
                }
            );

            logger.info('Dealer tradebook fetched successfully');
            return response.data;
		} catch (error: unknown) {
            logger.error('Error fetching dealer tradebook:', error);

            if (this.isDealerOnlyError(error)) {
                logger.warn('Dealer tradebook unavailable, falling back to investor endpoint');
                token = token ?? await this.getToken();
                return this.fetchInvestorTradeBook(clientID, token!);
            }

            const errorObj = error as AxiosError;
            throw new Error(errorObj.response?.data?.description || errorObj.response?.data?.message || errorObj.message || 'Failed to fetch dealer tradebook');
        }
    }

    /**
     * Get OrderBook (Dealer OrderBook API)
     * GET /interactive/orders/dealerorderbook?clientID=ON100
     */
    public async getOrderBook(userClientID: string): Promise<Record<string, unknown>> {
        let token: string | null = null;
        try {
            token = await this.getToken();

            logger.info('Fetching dealer orderbook:', { 
                userClientID,
                endpoint: '/interactive/orders/dealerorderbook'
            });

            // Use dealer orderbook API as per documentation
            const response = await this.apiClient.get(
                `/interactive/orders/dealerorderbook?clientID=${userClientID}`,
                {
                    headers: {
                        Authorization: token,
                    },
                }
            );

            logger.info('Dealer orderbook fetched successfully');

            // Try to detect if dealer orderbook has any orders
            const dealerPayload = response.data;
            const dealerOrders = this.extractArrayFromPayload(dealerPayload, [
                'result.listOrderDetails',
                'result.listOrderBook',
                'listOrderDetails',
                'orderBook',
                'orders',
            ]);

            if (!dealerOrders.length) {
                logger.info('Dealer orderbook is empty, fetching investor orderbook for client', {
                    clientID: userClientID,
                });
                // If dealer orderbook is empty, also fetch investor orderbook so that
                // manually placed orders from the client terminal are visible.
                token = token ?? (await this.getToken());
                return this.fetchInvestorOrderBook(userClientID, token);
            }

            return dealerPayload;
		} catch (error: unknown) {
            logger.error('Error fetching dealer orderbook:', error);

            if (this.isDealerOnlyError(error)) {
                logger.warn('Dealer orderbook unavailable, falling back to investor endpoint');
                token = token ?? await this.getToken();
                return this.fetchInvestorOrderBook(userClientID, token!);
            }

            const errorObj = error as AxiosError;
            throw new Error(errorObj.response?.data?.description || errorObj.response?.data?.message || errorObj.message || 'Failed to fetch dealer orderbook');
        }
    }

    /**
     * Get Balance
     */
    public async getBalance(clientID: string): Promise<Record<string, unknown>> {
        try {
            const token = await this.getToken();

            logger.info('Fetching balance:', { clientID });

            const response = await this.apiClient.get(
                `/interactive/user/balance?clientID=${clientID}`,
                {
                    headers: {
                        Authorization: token,
                    },
                }
            );

            logger.info('Balance fetched successfully');
            return response.data;
		} catch (error: unknown) {
            const errorObj = error as AxiosError;
            logger.error('Error fetching balance:', error);
            throw new Error(errorObj.response?.data?.description || 'Failed to fetch balance');
        }
    }

    /**
     * Determine if API response indicates dealer-only access
     */
    private isDealerOnlyError(error: unknown): boolean {
        const errorObj = error as AxiosError;
        const message =
            errorObj?.response?.data?.description ||
            errorObj?.response?.data?.message ||
            errorObj?.message ||
            '';
        return typeof message === 'string' && message.toLowerCase().includes('dealer');
    }

    private async fetchInvestorOrderBook(clientID: string, token: string): Promise<Record<string, unknown>> {
        logger.info('Fetching investor orderbook fallback', { clientID });

        const response = await this.apiClient.get(
            `/interactive/orders?clientID=${clientID}`,
            {
                headers: {
                    Authorization: token,
                },
            }
        );

        logger.info('Investor orderbook fetched successfully');
        return response.data;
    }

    private extractArrayFromPayload(payload: unknown, candidateKeys: string[] = []): unknown[] {
        if (!payload) return [];
        if (Array.isArray(payload)) return payload;

        const payloadObj = payload as Record<string, unknown>;
        for (const key of candidateKeys) {
            const segments = key.split('.');
            let current: unknown = payloadObj;
            for (const segment of segments) {
                if (current == null || typeof current !== 'object') break;
                current = (current as Record<string, unknown>)?.[segment];
            }

            if (Array.isArray(current)) {
                return current;
            }

            if (current && typeof current === 'object') {
                const values = Object.values(current);
                if (values.every(value => typeof value === 'object')) {
                    return values;
                }
            }
        }

        if (payloadObj?.result) {
            const fromResult = this.extractArrayFromPayload(payloadObj.result, candidateKeys);
            if (fromResult.length) return fromResult;
        }

        if (payloadObj?.data) {
            const fromData = this.extractArrayFromPayload(payloadObj.data, candidateKeys);
            if (fromData.length) return fromData;
        }

        if (typeof payload === 'object') {
            for (const value of Object.values(payload)) {
                const nested = this.extractArrayFromPayload(value, candidateKeys);
                if (nested.length) return nested;
            }
        }

        return [];
    }

    private async deriveTradeBookFromPositions(clientID: string): Promise<Record<string, unknown>> {
        try {
            const positionsPayload = await this.getPositions(clientID);
            const positions = this.extractArrayFromPayload(positionsPayload, [
                'DealerPositionDetails',
                'positionList',
                'PositionList',
                'positions',
            ]);

            const trades = positions.map((position: unknown) => {
                const pos = position as Record<string, unknown>;
                const quantity = parseFloat(String(pos.Quantity ?? pos.NetQty ?? 0)) || 0;
                const buyQty = parseFloat(String(pos.BuyQuantity ?? pos.BuyQty ?? 0)) || 0;
                const sellQty = parseFloat(String(pos.SellQuantity ?? pos.SellQty ?? 0)) || 0;
                const side = buyQty >= sellQty ? 'BUY' : 'SELL';
                const avgPrice = parseFloat(String(pos.BuyAveragePrice ?? pos.AvgPrice ?? 0)) || 0;
                const ltp = parseFloat(String(pos.LastTradedPrice ?? pos.LTP ?? avgPrice)) || 0;
                const tradeId =
                    String(pos.AppOrderID ?? '') ||
                    String(pos.ExchangeInstrumentId ?? '') ||
                    String(pos.ExchangeInstrumentID ?? '') ||
                    `POS-${String(pos.TradingSymbol ?? 'UNKNOWN')}`;

                return {
                    TradeID: tradeId,
                    TradingSymbol: String(pos.TradingSymbol ?? pos.Symbol ?? 'N/A'),
                    OrderSide: side,
                    TradeQuantity: Math.abs(quantity),
                    AverageTradePrice: avgPrice,
                    SettlementPrice: ltp,
                    TradeDateTime: String(pos.LastTradedTime ?? pos.UpdatedAt ?? new Date().toISOString()),
                    MTM: parseFloat(String(pos.MTM ?? pos.NetMTM ?? 0)) || (ltp - avgPrice) * quantity,
                    Source: 'positions_fallback',
                    OriginalPosition: pos,
                };
            });

            return {
                derived: true,
                source: 'positions_fallback',
                result: {
                    listTradeDetails: trades,
                },
            };
        } catch (error) {
            logger.error('Failed to derive tradebook from positions', {
                clientID,
                error: error instanceof Error ? error.message : error,
            });
            throw error instanceof Error ? error : new Error('Failed to derive tradebook from positions');
        }
    }

    private async fetchInvestorTradeBook(clientID: string, token: string): Promise<Record<string, unknown>> {
        logger.info('Fetching investor tradebook fallback', { clientID });

        try {
            const response = await this.apiClient.get(
                `/interactive/orders/tradebook?clientID=${clientID}`,
                {
                    headers: {
                        Authorization: token,
                    },
                }
            );

            logger.info('Investor tradebook fetched successfully');
            return response.data;
        } catch (error) {
            logger.warn('Investor tradebook unavailable, deriving from positions', {
                clientID,
                error: error instanceof Error ? error.message : error,
            });
            return this.deriveTradeBookFromPositions(clientID);
        }
    }

    /**
     * Get Holdings
     */
    public async getHoldings(clientID: string): Promise<Record<string, unknown>> {
        try {
            const token = await this.getToken();

            logger.info('Fetching holdings via Dealer API:', { 
                clientID,
                url: `/interactive/portfolio/holdings?clientID=${clientID}`,
                tokenPrefix: token?.substring(0, 20) + '...'
            });

            const response = await this.apiClient.get(
                `/interactive/portfolio/holdings?clientID=${clientID}`,
                {
                    headers: {
                        Authorization: token,
                    },
                }
            );

            // Log response to verify it's for the correct clientId
            logger.info('Holdings fetched successfully from Dealer API:', {
                clientID,
                responseStatus: response.status,
                hasData: !!response.data,
                dataKeys: response.data ? Object.keys(response.data) : []
            });

            // Validate response - check if response contains clientId info
            const responseData = response.data;
            if (responseData && typeof responseData === 'object') {
                // Check if response has clientId field that matches request
                const responseClientId = (responseData as any).clientID || 
                                       (responseData as any).ClientID || 
                                       (responseData as any).clientId;
                
                if (responseClientId && responseClientId !== clientID) {
                    logger.warn('Holdings response clientId mismatch:', {
                        requestedClientId: clientID,
                        responseClientId: responseClientId,
                        note: 'This might indicate API is returning wrong client data'
                    });
                }
            }

            return responseData;
		} catch (error: unknown) {
            const errorObj = error as AxiosError;
            logger.error('Error fetching holdings from Dealer API:', {
                clientID,
                status: errorObj.response?.status,
                statusText: errorObj.response?.statusText,
                error: errorObj.response?.data?.description || errorObj.message
            });
            throw new Error(errorObj.response?.data?.description || 'Failed to fetch holdings');
        }
    }

    /**
     * Place Order (Dealer Order API)
     * POST /interactive/orders
     */
    public async placeOrder(orderData: {
        exchangeSegment: string;
        exchangeInstrumentID: number;
        productType: string;
        orderType: string;
        orderSide: 'BUY' | 'SELL';
        timeInForce: string;
        disclosedQuantity: number;
        orderQuantity: string | number;
        limitPrice: number;
        orderUniqueIdentifier: string;
        stopPrice: number;
        clientID: string;
    }): Promise<Record<string, unknown>> {
        try {
            const token = await this.getToken();

            logger.info('📤 Placing LIVE order via Dealer API:', { 
                clientID: orderData.clientID?.substring(0, 3) + '***',
                exchangeSegment: orderData.exchangeSegment,
                exchangeInstrumentID: orderData.exchangeInstrumentID,
                orderSide: orderData.orderSide,
                orderQuantity: orderData.orderQuantity,
                productType: orderData.productType,
                orderType: orderData.orderType
            });

            const response = await this.apiClient.post(
                `/interactive/orders`,
                orderData,
                {
                    headers: {
                        Authorization: token,
                        'Content-Type': 'application/json',
                    },
                }
            );

            const orderId = (response.data as any)?.AppOrderID || (response.data as any)?.OrderID;
            logger.info('✅ Order placed successfully via Dealer API', {
                orderId,
                exchangeSegment: orderData.exchangeSegment,
                orderSide: orderData.orderSide,
                responseStatus: response.status
            });
            
            return response.data;
		} catch (error: unknown) {
            const errorObj = error as AxiosError;
            const errorDetails = errorObj.response?.data as any;
            const errorMessage = errorDetails?.description || errorDetails?.message || errorObj.message || 'Failed to place order';
            
            // Enhanced error logging with full details
            logger.error('❌ Error placing order via Dealer API:', {
                clientID: orderData.clientID?.substring(0, 3) + '***',
                exchangeSegment: orderData.exchangeSegment,
                exchangeInstrumentID: orderData.exchangeInstrumentID,
                orderSide: orderData.orderSide,
                orderQuantity: orderData.orderQuantity,
                productType: orderData.productType,
                orderType: orderData.orderType,
                error: errorMessage,
                status: errorObj.response?.status,
                statusText: errorObj.response?.statusText,
                fullResponseData: JSON.stringify(errorDetails, null, 2),
                sentOrderData: JSON.stringify(orderData, null, 2)
            });
            
            throw new Error(errorMessage);
        }
    }

    /**
     * Modify Order (Dealer Order API)
     * PUT /interactive/orders
     */
    public async modifyOrder(modifyData: {
        appOrderID: number;
        modifiedProductType: string;
        modifiedOrderType: string;
        modifiedOrderQuantity: number;
        modifiedDisclosedQuantity: number;
        modifiedLimitPrice: number;
        modifiedStopPrice: number;
        modifiedTimeInForce: string;
        orderUniqueIdentifier: string;
        clientID: string;
    }): Promise<Record<string, unknown>> {
        try {
            const token = await this.getToken();

            logger.info('Modifying order:', { 
                clientID: modifyData.clientID,
                appOrderID: modifyData.appOrderID
            });

            const response = await this.apiClient.put(
                `/interactive/orders`,
                modifyData,
                {
                    headers: {
                        Authorization: token,
                        'Content-Type': 'application/json',
                    },
                }
            );

            logger.info('Order modified successfully');
            return response.data;
		} catch (error: unknown) {
            const errorObj = error as AxiosError;
            logger.error('Error modifying order:', error);
            throw new Error(errorObj.response?.data?.description || 'Failed to modify order');
        }
    }

    /**
     * Cancel Order (Dealer Order API)
     * DELETE /interactive/orders?appOrderID=1100062468&clientID=ON190
     */
    public async cancelOrder(appOrderID: number, clientID: string): Promise<Record<string, unknown>> {
        try {
            const token = await this.getToken();

            logger.info('Cancelling order:', { clientID, appOrderID });

            const response = await this.apiClient.delete(
                `/interactive/orders?appOrderID=${appOrderID}&clientID=${clientID}`,
                {
                    headers: {
                        Authorization: token,
                    },
                }
            );

            logger.info('Order cancelled successfully');
            return response.data;
		} catch (error: unknown) {
            const errorObj = error as AxiosError;
            logger.error('Error cancelling order:', error);
            throw new Error(errorObj.response?.data?.description || 'Failed to cancel order');
        }
    }

    /**
     * Position Conversion
     */
    public async convertPosition(params: {
        exchangeSegment: string;
        exchangeInstrumentID: number;
        oldProductType: string;
        newProductType: string;
        isDayWise: boolean;
        targetQty: string;
        clientID: string;
    }): Promise<Record<string, unknown>> {
        try {
            const token = await this.getToken();

            logger.info('Converting position:', params);

            const response = await this.apiClient.put(
                '/interactive/portfolio/positions/convert',
                params,
                {
                    headers: {
                        Authorization: token,
                    },
                }
            );

            logger.info('Position converted successfully:', response.data);
            return response.data;
		} catch (error: unknown) {
            const errorObj = error as AxiosError;
            logger.error('Error converting position:', error);
            throw new Error(errorObj.response?.data?.description || 'Failed to convert position');
        }
    }

    /**
     * Square-Off Position
     */
    public async squareOff(params: {
        exchangeSegment: string;
        exchangeInstrumentID: number;
        productType: string;
        squareoffMode: string;
        squareOffQtyValue: number;
        clientID: string;
        positionSquareOffQuantityType: string;
    }): Promise<Record<string, unknown>> {
        try {
            const token = await this.getToken();

            logger.info('Square-off position:', params);

            const response = await this.apiClient.put(
                '/interactive/portfolio/squareoff',
                params,
                {
                    headers: {
                        Authorization: token,
                    },
                }
            );

            logger.info('Position squared-off successfully:', response.data);
            return response.data;
		} catch (error: unknown) {
            const errorObj = error as AxiosError;
            const errorDetails = errorObj.response?.data as any;
            const errorMessage = errorDetails?.description || errorDetails?.message || errorObj.message || 'Failed to square-off position';
            
            // Enhanced error logging for square-off
            logger.error('❌ Error square-off position:', {
                clientID: params.clientID?.substring(0, 3) + '***',
                exchangeSegment: params.exchangeSegment,
                exchangeInstrumentID: params.exchangeInstrumentID,
                squareoffMode: params.squareoffMode,
                squareOffQtyValue: params.squareOffQtyValue,
                error: errorMessage,
                status: errorObj.response?.status,
                statusText: errorObj.response?.statusText,
                fullResponseData: JSON.stringify(errorDetails, null, 2),
                sentSquareOffData: JSON.stringify(params, null, 2)
            });
            
            throw new Error(errorMessage);
        }
    }

    /**
     * Square-Off All Positions
     */
    public async squareOffAll(params: {
        squareoffMode: string;
        clientID: string;
    }): Promise<Record<string, unknown>> {
        try {
            const token = await this.getToken();

            logger.info('Square-off all positions:', params);

            const response = await this.apiClient.put(
                '/interactive/portfolio/squareoffall',
                params,
                {
                    headers: {
                        Authorization: token,
                    },
                }
            );

            logger.info('All positions squared-off successfully:', response.data);
            return response.data;
		} catch (error: unknown) {
            const errorObj = error as AxiosError;
            logger.error('Error square-off all positions:', error);
            throw new Error(errorObj.response?.data?.description || 'Failed to square-off all positions');
        }
    }
}

export default new DealerApiService();

