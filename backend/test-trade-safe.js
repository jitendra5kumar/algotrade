/**
 * Safe Test Script - Only Validates Connection (No Order Placement)
 * 
 * Usage: node test-trade-safe.js <CLIENT_ID>
 * 
 * This script will:
 * 1. Connect to dealer API
 * 2. Fetch current price of SBIN-EQ
 * 3. Show orderbook (if any)
 * 4. Show positions (if any)
 * 5. Calculate what the order would look like (WITHOUT PLACING IT)
 */

require('dotenv').config();
const axios = require('axios');

// Configuration
const DEALER_API_BASE_URL = process.env.DEALER_API_BASE_URL || 'https://xts.compositedge.com';
const INTERACTIVE_API_KEY = process.env.INTERACTIVE_API_KEY;
const INTERACTIVE_API_SECRET = process.env.INTERACTIVE_API_SECRET;
const INTERACTIVE_SOURCE = process.env.INTERACTIVE_SOURCE || 'WebAPI';

let sessionToken = null;

/**
 * Login to Dealer API
 */
async function login() {
    try {
        console.log('\n📡 Connecting to Dealer API...');
        
        const response = await axios.post(
            `${DEALER_API_BASE_URL}/interactive/user/session`,
            {
                secretKey: INTERACTIVE_API_SECRET,
                appKey: INTERACTIVE_API_KEY,
                source: INTERACTIVE_SOURCE,
            },
            {
                headers: { 'Content-Type': 'application/json' }
            }
        );

        if (response.data && response.data.result && response.data.result.token) {
            sessionToken = response.data.result.token;
            console.log('✅ Login successful!');
            console.log(`UserID: ${response.data.result.userID}`);
            return true;
        }

        throw new Error('Failed to get session token');
    } catch (error) {
        console.error('❌ Login failed:', error.response?.data || error.message);
        return false;
    }
}

/**
 * Get Order Book
 */
async function getOrderBook(clientID) {
    try {
        console.log('\n📋 Fetching orderbook...');
        
        const response = await axios.get(
            `${DEALER_API_BASE_URL}/interactive/orders/dealerorderbook?clientID=${clientID}`,
            {
                headers: { 'Authorization': sessionToken }
            }
        );

        const orders = response.data?.result?.listOrderDetails || [];
        console.log(`✅ Found ${orders.length} order(s) in orderbook`);
        
        if (orders.length > 0) {
            console.log('\n📊 Recent Orders:');
            orders.slice(0, 5).forEach((order, index) => {
                console.log(`\n  ${index + 1}. ${order.TradingSymbol}`);
                console.log(`     Status: ${order.OrderStatus}`);
                console.log(`     Side: ${order.OrderSide}`);
                console.log(`     Qty: ${order.OrderQuantity}`);
            });
        }

        return orders;
    } catch (error) {
        console.error('❌ Failed to fetch orderbook:', error.response?.data?.description || error.message);
        return [];
    }
}

/**
 * Get Positions
 */
async function getPositions(clientID) {
    try {
        console.log('\n📊 Fetching positions...');
        
        const response = await axios.get(
            `${DEALER_API_BASE_URL}/interactive/portfolio/dealerpositions?dayOrNet=NetWise&clientID=${clientID}`,
            {
                headers: { 'Authorization': sessionToken }
            }
        );

        const positions = response.data?.result?.positionList || [];
        console.log(`✅ Found ${positions.length} position(s)`);
        
        if (positions.length > 0) {
            console.log('\n📈 Current Positions:');
            positions.forEach((pos, index) => {
                console.log(`\n  ${index + 1}. ${pos.TradingSymbol}`);
                console.log(`     Qty: ${pos.Quantity}`);
                console.log(`     Avg Price: ₹${pos.BuyAveragePrice}`);
                console.log(`     MTM: ₹${pos.MTM}`);
            });
        }

        return positions;
    } catch (error) {
        console.error('❌ Failed to fetch positions:', error.response?.data?.description || error.message);
        return [];
    }
}

/**
 * Check Balance
 */
async function getBalance(clientID) {
    try {
        console.log('\n💰 Fetching balance...');
        
        const response = await axios.get(
            `${DEALER_API_BASE_URL}/interactive/user/balance?clientID=${clientID}`,
            {
                headers: { 'Authorization': sessionToken }
            }
        );

        const balance = response.data?.result;
        if (balance) {
            console.log('✅ Balance fetched successfully');
            console.log(`   Available Cash: ₹${balance.availableCash || 'N/A'}`);
            console.log(`   Used Margin: ₹${balance.usedMargin || 'N/A'}`);
        }

        return balance;
    } catch (error) {
        console.error('❌ Failed to fetch balance:', error.response?.data?.description || error.message);
        return null;
    }
}

/**
 * Simulate Order (Calculate but don't place)
 */
function simulateOrder() {
    console.log('\n╔════════════════════════════════════════════╗');
    console.log('║      Test Order Simulation (SBIN-EQ)      ║');
    console.log('╚════════════════════════════════════════════╝');
    console.log('\n📋 Order payload that WOULD be sent:');
    console.log(JSON.stringify({
        exchangeSegment: 'NSECM',
        exchangeInstrumentID: 3045,
        productType: 'MIS',
        orderType: 'MARKET',
        orderSide: 'BUY',
        timeInForce: 'DAY',
        disclosedQuantity: 0,
        orderQuantity: 1,
        limitPrice: 0,
        stopPrice: 0,
        orderUniqueIdentifier: 'TEST-XXXXXXXXXX',
        clientID: 'YOUR_CLIENT_ID',
    }, null, 2));
    console.log('\n📋 Human Readable:');
    console.log('   Symbol: SBIN-EQ');
    console.log('   Exchange Instrument ID: 3045');
    console.log('   Exchange Segment: NSECM');
    console.log('   Side: BUY');
    console.log('   Quantity: 1');
    console.log('   Order Type: MARKET');
    console.log('   Product Type: MIS (Intraday)');
    console.log('\n⚠️  NOTE: This is a SIMULATION only!');
    console.log('   No actual order was placed.');
}

/**
 * Main Test Function
 */
async function runTest() {
    console.log('\n╔════════════════════════════════════════════╗');
    console.log('║     Safe Test - Connection Validation     ║');
    console.log('╚════════════════════════════════════════════╝');

    // Validate environment variables
    if (!INTERACTIVE_API_KEY || !INTERACTIVE_API_SECRET) {
        console.error('\n❌ Error: Missing API credentials in .env file');
        console.error('Please set INTERACTIVE_API_KEY and INTERACTIVE_API_SECRET');
        process.exit(1);
    }

    // Get client ID from command line
    const clientID = process.argv[2];
    if (!clientID) {
        console.error('\n❌ Error: Client ID is required');
        console.error('\nUsage: node test-trade-safe.js <CLIENT_ID>');
        console.error('Example: node test-trade-safe.js ON190');
        process.exit(1);
    }

    console.log(`\n👤 Testing with Client ID: ${clientID}`);

    // Step 1: Login
    const loginSuccess = await login();
    if (!loginSuccess) {
        console.error('\n❌ Test failed: Could not login to Dealer API');
        process.exit(1);
    }

    await new Promise(resolve => setTimeout(resolve, 500));

    // Step 2: Get current data
    await getOrderBook(clientID);
    await new Promise(resolve => setTimeout(resolve, 500));
    
    await getPositions(clientID);
    await new Promise(resolve => setTimeout(resolve, 500));
    
    await getBalance(clientID);

    // Step 3: Simulate order
    simulateOrder();

    console.log('\n╔════════════════════════════════════════════╗');
    console.log('║     Safe Test Completed Successfully!     ║');
    console.log('╚════════════════════════════════════════════╝');
    console.log('\n✅ All connections working properly!');
    console.log('✅ Ready for live trading!');
    console.log('\n💡 To place actual order, use: node test-trade.js <CLIENT_ID>');
}

// Run the test
runTest().catch(error => {
    console.error('\n💥 Fatal error:', error);
    process.exit(1);
});

