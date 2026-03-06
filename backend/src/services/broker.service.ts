import User from '../models/User.model';
import logger from '../utils/logger';
import dealerApiService from './dealer-api.service';
import {jwtDecode} from 'jwt-decode';
import {encrypt, decrypt}  from '../utils/crypto.util';

export class BrokerService {
  /**
   * Connect to broker with credentials
   */
  static async connectBroker(brokerData: {
    userId: string;
    broker: string;
    clientId: string;
    password?: string;
    apiKey?: string;
    apiSecret?: string;
    marketDataApiKey?: string;
    marketDataSecret?: string;
  }) {
    try {
      const { userId, broker, clientId, password } = brokerData;

      logger.info('Broker connection attempt:', {
        userId,
        broker,
        clientId,
        hasPassword: !!password
      });

      // Find user
      const user = await User.findById(userId);
      if (!user) {
        logger.error('User not found for broker connection:', { userId });
        throw new Error('User not found');
      }

      logger.info('User found for broker connection:', {
        userId: user._id,
        email: user.email
      });

      // Fetch fresh token when connecting broker - this is the ONLY place where fresh token is fetched
      const dealerToken = null;
      const dealerUserId = null;

      try {
        logger.info('Fetching fresh broker token on connect...');

        // const loginResult = await dealerApiService.login();
        const dealerToken = await this.getDealerToken();
        console.log('dealer token in use:',dealerToken)

        // If loginResult is a string (the token), wrap it in an object for compatibility
        // if (typeof loginResult === 'string') {
        //   dealerToken = loginResult;
        //   dealerUserId = null;
        // } else if (typeof loginResult === 'object' && loginResult !== null) {
        //   dealerToken = (loginResult as any).token ?? null;
        //   dealerUserId = (loginResult as any).userId ?? null; // Use value from actual API response if available
        // } else {
        //   dealerToken = null;
        //   dealerUserId = null;
        // }

        logger.info('Dealer API connection successful:', {
          hasToken: !!dealerToken,
          dealerUserId
        });
      } catch (error: unknown) {
        const errorObj = error as { message?: string; stack?: string };
        logger.error('Dealer API connection failed:', {
          error: errorObj.message,
          stack: errorObj.stack
        });

        // For now, we'll allow connection to proceed even if dealer API fails
        // This allows testing without full dealer API setup
        logger.warn('Continuing with broker connection despite dealer API failure');
      }

      // Store broker credentials in database
      const brokerCredentials: any = {
        broker,
        clientId,
        password: password || undefined,
        // Credentials are stored at the admin level. This is just a placeholder.
        apiKey: null,
        apiSecret: null,
        marketDataApiKey: null,
        marketDataSecret: null,
        connectedAt: new Date(),
        isConnected: true,
        tokenEnc: null, //dealerToken ? encrypt(dealerToken) : '',
        dealerUserId: dealerUserId || null,
        lastTokenRefresh: dealerToken ? new Date() : null
      };

      // Update user with broker credentials
      logger.info('Saving broker credentials to database:', {
        userId: user._id,
        broker,
        clientId,
        hasToken: !!dealerToken
      });

      user.brokerCredentials = brokerCredentials;
      await user.save();

      logger.info(`Broker connected successfully for user: ${user.email}`, {
        broker,
        clientId,
        connectedAt: brokerCredentials.connectedAt,
        hasDealerToken: !!dealerToken,
        isConnected: true
      });

      return {
        broker,
        clientId,
        connectedAt: brokerCredentials.connectedAt,
        isConnected: true,
        hasDealerToken: !!dealerToken,
        message: dealerToken ? 'Broker connected with dealer API access' : 'Broker connected (dealer API not available)'
      };
    } catch (error: unknown) {
      const errorObj = error as { message?: string; stack?: string };
      logger.error('Error connecting broker:', {
        error: errorObj.message,
        stack: errorObj.stack,
        brokerData: {
          userId: brokerData.userId,
          broker: brokerData.broker,
          clientId: brokerData.clientId
        }
      });

      // Return a more specific error message
      const errorMessage = errorObj.message || 'Failed to connect broker';
      throw new Error(errorMessage);
    }
  }

  /**
 * Get broker connection status
 */
  static async getBrokerStatus(userId: string) {
    try {
      // Fetch user - fetch all fields by default, only explicitly include clientId (which has select: false)
      // Using a single select statement to avoid path collision
      logger.info('Getting broker status for user:', { userId });
      const user = await User.findById(userId).select('+brokerCredentials.clientId');
      
      if (!user) {
        throw new Error('User not found');
      }

      logger.info('getBrokerStatus - User found:', {
        userId: user._id?.toString(),
        email: user.email,
        role: user.role,
        hasBrokerCredentials: !!user.brokerCredentials,
        clientId: user.brokerCredentials?.clientId,
        broker: user.brokerCredentials?.broker,
        isConnected: user.brokerCredentials?.isConnected,
        connectedAt: user.brokerCredentials?.connectedAt
      });

      // Check if brokerCredentials exists and has required fields
      const brokerCreds = user.brokerCredentials;
      const status = {
        isConnected: brokerCreds?.isConnected === true,
        broker: brokerCreds?.broker || null,
        clientId: brokerCreds?.clientId || null,
        connectedAt: brokerCreds?.connectedAt || null
      };

      logger.info('getBrokerStatus - Returning status:', {
        ...status,
        userId: user._id?.toString(),
        email: user.email,
        role: user.role
      });

      return status;
    } catch (error: any) {
      logger.error('Error getting broker status:', error);
      logger.error('Error stack:', error?.stack);
      const errorObj = error as { message?: string };
      throw new Error(errorObj.message || 'Failed to get broker status');
    }
  }

  /**
 * Get broker token - Uses stored token from database ONLY
 * NOTE: Does NOT fetch fresh token. Token must be obtained via connectBroker() first.
 * Fresh token is only fetched when connecting broker, not here.
 */
  static async getBrokerToken(userId: string) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      if (!user.brokerCredentials?.isConnected) {
        throw new Error('Broker not connected');
      }

      // Use stored token from database ONLY - don't fetch fresh
      if (user.brokerCredentials.tokenEnc) {
        const storedToken = decrypt(String(user.brokerCredentials.tokenEnc));
        logger.info('Using stored broker token from database:', { userId, email: user.email });
        return storedToken;
      }

      // No token in database - throw error instead of fetching fresh
      // Token should be obtained via connectBroker() method
      logger.error('No broker token found in database. Please connect broker first:', { userId, email: user.email });
      throw new Error('No broker token found. Please connect your broker first to get a token.');
    } catch (error: any) {
      logger.error('Error getting broker token:', error);
      const errorObj = error as { message?: string };
      throw new Error(errorObj.message || 'Failed to get broker token');
    }
  }

  /**
 * Validate broker token
 */
  static async validateBrokerToken(userId: string) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      if (!user.brokerCredentials?.isConnected) {
        return false;
      }

      if (!user.brokerCredentials?.tokenEnc) {
        return false;
      }

      // Test token validity by making a simple API call
      try {
        // Try to get balance using the stored token to validate it
        const balanceResponse = await dealerApiService.getBalance(user.brokerCredentials.clientId!);

        logger.info(`Broker token validation successful for user: ${user.email}`, {
          broker: user.brokerCredentials.broker,
          clientId: user.brokerCredentials.clientId,
          hasBalanceData: !!balanceResponse
        });

        return true;
      } catch (error: unknown) {
        const errorObj = error as { message?: string };
        logger.warn(`Broker token validation failed for user: ${user.email}`, {
          error: errorObj.message,
          broker: user.brokerCredentials.broker,
          clientId: user.brokerCredentials.clientId
        });

        // NOTE: Removed automatic refresh - just return false if token is invalid
        return false;
      }
    } catch (error: unknown) {
      const errorObj = error as { message?: string };
      logger.error('Error validating broker token:', error);
      throw new Error(errorObj.message || 'Failed to validate broker token');
    }
  }

  /**
 * Disconnect broker
 */
  static async disconnectBroker(userId: string) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Clear broker credentials
      user.brokerCredentials = {
        broker: undefined,
        clientId: undefined,
        password: undefined,
        apiKey: undefined,
        apiSecret: undefined,
        marketDataApiKey: undefined,
        marketDataSecret: undefined,
        tokenEnc: undefined,
        isConnected: false,
        connectedAt: undefined,
        tokenGeneratedAt: undefined
      };

      await user.save();

      logger.info(`Broker disconnected for user: ${user.email}`);

      return true;
    } catch (error: any) {
      logger.error('Error disconnecting broker:', error);
      const errorObj = error as { message?: string };
      throw new Error(errorObj.message || 'Failed to disconnect broker');
    }
  }

  /**
   * Get dealer interactive api token
   * NOTE: Uses stored token from database. Only fetches new token if none exists.
   * Does NOT auto-refresh based on expiry.
   */
  private static async getDealerToken() {

    //Load token from the database. 
    
    // Find first admin user (system user) or create a system user
    const adminUser = await User.findOne({
      role: { $in: ["ADMIN", "SUPER_ADMIN"] },
    })
      .select("_id brokerCredentials")
      .exec();

    if (!adminUser || !adminUser._id) {
      logger.warn("No admin user found for dealer token storage");
      throw new Error ("No admin user found for dealer token storage");
    }

    //If token not available in the database or it is expired, fetch a new token. 
    if(adminUser.brokerCredentials?.tokenEnc){
      const storedToken = decrypt(String(adminUser.brokerCredentials.tokenEnc));
      if(storedToken && !this.isExpired(storedToken)){
        logger.info("Using stored dealer token from database.");
        return storedToken;        
      }

      //Try fetching a new token from the api. 
      logger.warn("Token is expired. Fetching a new token from the api.");
      const newToken = await this.fetchTokenFromAPI();
      if (!newToken) {
        throw new Error('Failed to fetch dealer token');
      }
      //Save the token in the database.
      try{
        await User.findByIdAndUpdate(adminUser._id, {
          $set: {
            'brokerCredentials.tokenEnc': encrypt(newToken),
            'brokerCredentials.isConnected': true, // Keep plain token as backup
            'brokerCredentials.tokenGeneratedAt': new Date(),
            'marketDataCredentials.connectedAt': new Date()
          },
        });
  
      }catch(error: any){
        logger.error('Error saving dealer token in database:', error);
        throw error;
      }
      

      return newToken;
      
    }else{
      logger.warn("No token found in database. Please connect your broker first to get a token.");
      const newToken = await this.fetchTokenFromAPI();
      if (!newToken) {
        throw new Error('Failed to fetch dealer token');
      }
      //Save the token in the database.
      if(adminUser.brokerCredentials){
        adminUser.brokerCredentials.tokenEnc = encrypt(newToken);
        adminUser.save();
      }

      return newToken;
    }

 
  }


  private  static async  fetchTokenFromAPI() {
    let dealerToken: string | null = null;
    try{
      const loginResult = await dealerApiService.login();

    // If loginResult is a string (the token), wrap it in an object for compatibility
        if (typeof loginResult === 'string') {
          dealerToken = loginResult;
        } else if (typeof loginResult === 'object' && loginResult !== null) {
          dealerToken = (loginResult as { token?: string }).token ?? null;
        } else {
          dealerToken = null;
        }
    
      
    }catch(e){
      logger.error("Error fetching token from dealer API:", e);
      throw e;
    }
    
    return dealerToken;
  }

  private static isExpired(token: string) {
    if(!token)
      return true;
    try{
      const decodedToken = jwtDecode(token);
      const currentTime = Date.now()/1000;
      if(decodedToken && decodedToken.exp){
        return decodedToken.exp < currentTime;
      }
      return true;  
    }catch(e){
      logger.log('Error decoding dealer token:',e)
      return true;
    }
  }
}

export const brokerService = new BrokerService();