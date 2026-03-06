import { Request, Response } from 'express';
import { BrokerService } from '../services/broker.service';
import { ActivityLogService } from '../services/activity-log.service';
import dealerApiService from '../services/dealer-api.service';
import marketDataService from '../services/market-data.service';
import websocketMarketDataService from '../services/websocket-market-data.service';
import logger from '../utils/logger';

export class BrokerController {
  /**
   * Connect to broker with credentials
   */
  static async connectBroker(req: Request, res: Response): Promise<Response | void> {
    try {
      const { broker, clientId, password, apiKey, apiSecret, marketDataApiKey, marketDataSecret } = req.body;
      const userId = req.user?.userId;

      logger.info('Broker connect request received:', {
        userId,
        broker,
        clientId,
        hasPassword: !!password,
        hasApiKey: !!apiKey,
        hasApiSecret: !!apiSecret,
        hasMarketDataApiKey: !!marketDataApiKey,
        hasMarketDataSecret: !!marketDataSecret
      });

      if (!userId) {
        logger.warn('User not authenticated for broker connection');
        return res.status(401).json({
          success: false,
          message: 'User not authenticated'
        });
      }

      // Validate required fields - Only broker and clientId are required
      // API credentials will be used from environment variables
      if (!broker || !clientId) {
        logger.warn('Missing required fields:', {
          broker: !!broker,
          clientId: !!clientId
        });
        return res.status(400).json({
          success: false,
          message: 'Missing required fields: broker and clientId'
        });
      }

      logger.info('Using environment credentials for dealer API:', {
        hasDealerAppKey: !!process.env.DEALER_APP_KEY,
        hasDealerSecretKey: !!process.env.DEALER_SECRET_KEY,
        dealerApiBaseUrl: process.env.DEALER_API_BASE_URL
      });

      logger.info('Calling broker service with data:', {
        userId,
        broker,
        clientId,
        hasPassword: !!password,
        usingEnvironmentCredentials: true
      });

      const result = await BrokerService.connectBroker({
        userId,
        broker,
        clientId,
        password,
        // API credentials will be taken from environment variables
        apiKey: apiKey,
        apiSecret: apiSecret,
        marketDataApiKey: marketDataApiKey,
        marketDataSecret: marketDataSecret
      });

      logger.info('Broker service result:', result);

      // Log successful broker connection (non-blocking)
      try {
        await ActivityLogService.createLog({
          userId,
          type: 'broker',
          title: 'Broker Connected',
          description: `Successfully connected to ${broker} with client ID: ${clientId}`,
          status: 'success',
          metadata: { broker, clientId }
        });
      } catch (logError) {
        logger.error('Failed to log broker connection, but continuing:', logError);
      }

      // Start market data WebSocket after successful broker connection
      try {
        logger.info('Starting market data WebSocket...');
        await websocketMarketDataService.start(result?.clientId ?? undefined);
        logger.info('Market data WebSocket started successfully');
      } catch (wsError) {
        logger.error('Failed to start market data WebSocket:', wsError);
        // Don't fail the broker connection, just log the error
      }

      res.status(200).json({
        success: true,
        message: 'Broker connected successfully',
        data: result
      });
		} catch (error: unknown) {
      logger.error('Error connecting broker:', {
        message: (error as Error).message,
        stack: (error as Error).stack || 'No stack trace available',
        userId: req.user?.userId || 'No user ID available'
      });

      // Log failed broker connection attempt (non-blocking)
      const userId = req.user?.userId;
      if (userId) {
        try {
          await ActivityLogService.createLog({
            userId,
            type: 'broker',
            title: 'Broker Connection Failed',
            description: `Failed to connect to ${req.body.broker}: ${(error as Error).message}`,
            status: 'error',
            metadata: { broker: req.body.broker, error: (error as Error).message }
          });
        } catch (logError) {
          logger.error('Failed to log broker error, but continuing:', logError);
        }
      }
      
      // Don't crash the server, return proper error response
      res.status(500).json({
        success: false,
        message: (error as Error).message || 'Failed to connect broker'
      });
    }
  }

  /**
   * Get broker connection status
   */
  static async getBrokerStatus(req: Request, res: Response): Promise<Response | void> {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'User not authenticated'
        });
      }

      const status = await BrokerService.getBrokerStatus(userId);

      res.status(200).json({
        success: true,
        data: status
      });
		} catch (error: unknown) {
      logger.error('Error getting broker status:', error);
      res.status(500).json({
        success: false,
        message: (error as Error).message || 'Failed to get broker status'
      });
    }
  }

  /**
   * Get broker token
   */
  static async getBrokerToken(req: Request, res: Response): Promise<Response | void> {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'User not authenticated'
        });
      }

      const token = await BrokerService.getBrokerToken(userId);

      res.status(200).json({
        success: true,
        data: { token }
      });
		} catch (error: unknown) {
      logger.error('Error getting broker token:', error);
      res.status(500).json({
        success: false,
        message: (error as Error).message || 'Failed to get broker token'
      });
    }
  }

  /**
   * Validate broker token
   */
  static async validateBrokerToken(req: Request, res: Response): Promise<Response | void> {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'User not authenticated'
        });
      }

      const isValid = await BrokerService.validateBrokerToken(userId);

      res.status(200).json({
        success: true,
        data: { isValid }
      });
		} catch (error: unknown) {
      logger.error('Error validating broker token:', error);
      res.status(500).json({
        success: false,
        message: (error as Error).message || 'Failed to validate broker token'
      });
    }
  }

  /**
   * Disconnect broker
   */
  static async disconnectBroker(req: Request, res: Response): Promise<Response | void> {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'User not authenticated'
        });
      }

      await BrokerService.disconnectBroker(userId);

      // Stop market data WebSocket when broker disconnects
      if (websocketMarketDataService.isActive()) {
        logger.info('Stopping market data WebSocket...');
        websocketMarketDataService.stop();
        logger.info('Market data WebSocket stopped');
      }

      res.status(200).json({
        success: true,
        message: 'Broker disconnected successfully'
      });
		} catch (error: unknown) {
      logger.error('Error disconnecting broker:', error);
      res.status(500).json({
        success: false,
        message: (error as Error).message || 'Failed to disconnect broker'
      });
    }
  }

  /**
   * Get orderbook data
   */
  static async getOrderBook(req: Request, res: Response): Promise<Response | void> {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'User not authenticated'
        });
      }

      // Get broker status to check if connected
      const brokerStatus = await BrokerService.getBrokerStatus(userId);
      if (!brokerStatus.isConnected || !brokerStatus.clientId) {
        return res.status(400).json({
          success: false,
          message: 'Broker not connected. Please connect broker first.'
        });
      }

      // Get orderbook data from dealer API (investor APIs)
      const orderbookData = await dealerApiService.getOrderBook(brokerStatus.clientId);

      res.status(200).json({
        success: true,
        data: orderbookData
      });
		} catch (error: unknown) {
      logger.error('Error getting orderbook:', error);
      res.status(500).json({
        success: false,
        message: (error as Error).message || 'Failed to get orderbook data'
      });
    }
  }

  /**
   * Get positions data
   */
  static async getPositions(req: Request, res: Response): Promise<Response | void> {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'User not authenticated'
        });
      }

      // Get broker status to check if connected
      const brokerStatus = await BrokerService.getBrokerStatus(userId);
      if (!brokerStatus.isConnected || !brokerStatus.clientId) {
        return res.status(400).json({
          success: false,
          message: 'Broker not connected. Please connect broker first.'
        });
      }

      // Get positions data from dealer API (investor APIs)
      const positionsData = await dealerApiService.getPositions(brokerStatus.clientId);

      res.status(200).json({
        success: true,
        data: positionsData
      });
		} catch (error: unknown) {
      logger.error('Error getting positions:', error);
      res.status(500).json({
        success: false,
        message: (error as Error).message || 'Failed to get positions data'
      });
    }
  }

  /**
   * Get holdings data
   */
  static async getHoldings(req: Request, res: Response): Promise<Response | void> {
    const userId = req.user?.userId;
    
    try {
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'User not authenticated'
        });
      }

      const brokerStatus = await BrokerService.getBrokerStatus(userId);
      if (!brokerStatus.isConnected || !brokerStatus.clientId) {
        return res.status(400).json({
          success: false,
          message: 'Broker not connected. Please connect broker first.'
        });
      }

      // Log the clientId being used for this specific user
      logger.info('Fetching holdings for user:', {
        userId,
        clientId: brokerStatus.clientId,
        broker: brokerStatus.broker,
        email: req.user?.email
      });

      const holdingsData = await dealerApiService.getHoldings(brokerStatus.clientId);

      // Log the response to verify it's for the correct clientId
      const holdingsDataAny = holdingsData as any;
      logger.info('Holdings fetched successfully:', {
        userId,
        clientId: brokerStatus.clientId,
        holdingsCount: Array.isArray(holdingsData) ? holdingsData.length : 
                      holdingsDataAny?.RMSHoldings?.Holdings?.length || 
                      holdingsDataAny?.Holdings?.length || 
                      'unknown'
      });

      res.status(200).json({
        success: true,
        data: holdingsData
      });
		} catch (error: unknown) {
      logger.error('Error getting holdings:', {
        error: (error as Error).message,
        userId: userId || 'unknown',
        stack: (error as Error).stack
      });
      res.status(500).json({
        success: false,
        message: (error as Error).message || 'Failed to get holdings data'
      });
    }
  }

  /**
   * Get tradebook data
   */
  static async getTradeBook(req: Request, res: Response): Promise<Response | void> {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'User not authenticated'
        });
      }

      // Get broker status to check if connected
      const brokerStatus = await BrokerService.getBrokerStatus(userId);
      console.log('brokerStatus',brokerStatus)
      if (!brokerStatus.isConnected || !brokerStatus.clientId) {
        return res.status(400).json({
          success: false,
          message: 'Broker not connected. Please connect broker first.'
        });
      }

      // Get tradebook data from dealer API (investor APIs)
      const tradebookData = await dealerApiService.getTradeBook(brokerStatus.clientId);

      res.status(200).json({
        success: true,
        data: tradebookData
      });
		} catch (error: unknown) {
      logger.error('Error getting tradebook:', error);
      res.status(500).json({
        success: false,
        message: (error as Error).message || 'Failed to get tradebook data'
      });
    }
  }

  /**
   * Get market data token
   */
  static async getMarketDataToken(req: Request, res: Response): Promise<Response | void> {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'User not authenticated'
        });
      }

      // Get market data token
      const token = await marketDataService.getMarketDataToken();

      res.status(200).json({
        success: true,
        data: { token }
      });
		} catch (error: unknown) {
      logger.error('Error getting market data token:', error);
      res.status(500).json({
        success: false,
        message: (error as Error).message || 'Failed to get market data token'
      });
    }
  }

  /**
   * Get market data quotes
   */
  static async getMarketDataQuotes(req: Request, res: Response): Promise<Response | void> {
    try {
      const userId = req.user?.userId;
      const { symbols } = req.body;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'User not authenticated'
        });
      }

      if (!symbols || !Array.isArray(symbols)) {
        return res.status(400).json({
          success: false,
          message: 'Symbols array is required'
        });
      }

      // Get market data quotes
      const quotes = await marketDataService.getLiveQuotes(symbols);

      res.status(200).json({
        success: true,
        data: quotes
      });
		} catch (error: unknown) {
      logger.error('Error getting market data quotes:', error);
      res.status(500).json({
        success: false,
        message: (error as Error).message || 'Failed to get market data quotes'
      });
    }
  }
}