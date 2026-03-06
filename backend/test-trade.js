/**
 * Test Script for SBIN-EQ Trade Execution
 * 
 * Usage: node test-trade.js
 * 
 * This script will:
 * 1. Connect to dealer API
 * 2. Place a test order for SBIN-EQ (3045)
 * 3. Show the order result
 */

require('dotenv').config();
const axios = require('axios');

// Configuration
const DEALER_API_BASE_URL = process.env.DEALER_API_BASE_URL || 'https://xts.compositedge.com';
const INTERACTIVE_API_KEY = process.env.INTERACTIVE_API_KEY;
const INTERACTIVE_API_SECRET = process.env.INTERACTIVE_API_SECRET;
const INTERACTIVE_SOURCE = process.env.INTERACTIVE_SOURCE || 'WebAPI';

// Test Order Configuration for SBIN-EQ
const TEST_ORDER = {
    exchangeSegment: 'NSECM',
    exchangeInstrumentID: 3045,
    productType: 'MIS',           // Intraday
    orderType: 'MARKET',          // Market order
    orderSide: 'BUY',             // Buy
    orderQuantity: 1,             // Just 1 share for testing (API expects orderQuantity, not quantity)
    limitPrice: 0,
    stopPrice: 0,
    disclosedQuantity: 0,
    timeInForce: 'DAY',
};

let sessionToken = null;

/**
 * Login to Dealer API
 */
async function login() {
    try {
        console.log('\n📡 Connecting to Dealer API...');
        console.log(`API URL: ${DEALER_API_BASE_URL}`);
        
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
 * Place Test Order
 */
async function placeTestOrder(clientID) {
    try {
        console.log('\n📈 Placing test order for SBIN-EQ...');
        console.log('Order Details:');
        console.log(`  Symbol: SBIN-EQ`);
        console.log(`  Exchange Segment: ${TEST_ORDER.exchangeSegment}`);
        console.log(`  Exchange Instrument ID: ${TEST_ORDER.exchangeInstrumentID}`);
        console.log(`  Side: ${TEST_ORDER.orderSide}`);
        console.log(`  Quantity: ${TEST_ORDER.orderQuantity}`);
        console.log(`  Order Type: ${TEST_ORDER.orderType}`);
        console.log(`  Product Type: ${TEST_ORDER.productType}`);

        const orderData = {
            exchangeSegment: TEST_ORDER.exchangeSegment,
            exchangeInstrumentID: TEST_ORDER.exchangeInstrumentID,
            productType: TEST_ORDER.productType,
            orderType: TEST_ORDER.orderType,
            orderSide: TEST_ORDER.orderSide,
            timeInForce: TEST_ORDER.timeInForce,
            disclosedQuantity: TEST_ORDER.disclosedQuantity,
            orderQuantity: TEST_ORDER.orderQuantity,
            limitPrice: TEST_ORDER.limitPrice,
            orderUniqueIdentifier: `TEST-${Date.now()}`,
            stopPrice: TEST_ORDER.stopPrice,
            clientID: clientID,
        };

        console.log('\n📤 Sending order payload:', JSON.stringify(orderData, null, 2));

        const response = await axios.post(
            `${DEALER_API_BASE_URL}/interactive/orders`,
            orderData,
            {
                headers: {
                    'Authorization': sessionToken,
                    'Content-Type': 'application/json',
                }
            }
        );

        console.log('\n✅ Order placed successfully!');
        console.log('Response:', JSON.stringify(response.data, null, 2));

        const orderId = response.data?.AppOrderID || response.data?.OrderID;
        if (orderId) {
            console.log(`\n🎯 Order ID: ${orderId}`);
        }

        return response.data;
    } catch (error) {
        console.error('\n❌ Order placement failed!');
        if (error.response) {
            console.error('Error Response:', JSON.stringify(error.response.data, null, 2));
            console.error('Status:', error.response.status);
        } else {
            console.error('Error:', error.message);
        }
        return null;
    }
}

/**
 * Get Order Book to verify order
 */
async function getOrderBook(clientID) {
    try {
        console.log('\n📋 Fetching orderbook to verify...');
        
        const response = await axios.get(
            `${DEALER_API_BASE_URL}/interactive/orders/dealerorderbook?clientID=${clientID}`,
            {
                headers: {
                    'Authorization': sessionToken,
                }
            }
        );

        console.log('✅ Orderbook fetched successfully!');
        
        // Find SBIN orders
        const orders = response.data?.result?.listOrderDetails || [];
        const sbinOrders = orders.filter(o => o.TradingSymbol === 'SBIN-EQ');
        
        if (sbinOrders.length > 0) {
            console.log(`\n📊 Found ${sbinOrders.length} SBIN-EQ order(s):`);
            sbinOrders.forEach((order, index) => {
                console.log(`\nOrder ${index + 1}:`);
                console.log(`  Order ID: ${order.AppOrderID}`);
                console.log(`  Status: ${order.OrderStatus}`);
                console.log(`  Side: ${order.OrderSide}`);
                console.log(`  Quantity: ${order.OrderQuantity}`);
                console.log(`  Price: ${order.OrderPrice}`);
            });
        } else {
            console.log('\n⚠️  No SBIN-EQ orders found in orderbook');
        }

        return response.data;
    } catch (error) {
        console.error('\n❌ Failed to fetch orderbook:', error.response?.data || error.message);
        return null;
    }
}

/**
 * Main Test Function
 */
async function runTest() {
    console.log('\n╔════════════════════════════════════════════╗');
    console.log('║   SBIN-EQ Trade Execution Test Script     ║');
    console.log('╚════════════════════════════════════════════╝');

    // Validate environment variables
    if (!INTERACTIVE_API_KEY || !INTERACTIVE_API_SECRET) {
        console.error('\n❌ Error: Missing API credentials in .env file');
        console.error('Please set INTERACTIVE_API_KEY and INTERACTIVE_API_SECRET');
        process.exit(1);
    }

    // Get client ID from command line or use default
    const clientID = process.argv[2];
    if (!clientID) {
        console.error('\n❌ Error: Client ID is required');
        console.error('\nUsage: node test-trade.js <CLIENT_ID>');
        console.error('Example: node test-trade.js ON190');
        process.exit(1);
    }

    console.log(`\n👤 Testing with Client ID: ${clientID}`);

    // Step 1: Login
    const loginSuccess = await login();
    if (!loginSuccess) {
        console.error('\n❌ Test failed: Could not login to Dealer API');
        process.exit(1);
    }

    // Wait a moment
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Step 2: Place order
    const orderResult = await placeTestOrder(clientID);
    if (!orderResult) {
        console.error('\n❌ Test failed: Could not place order');
        process.exit(1);
    }

    // Wait a moment
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Step 3: Verify order in orderbook
    await getOrderBook(clientID);

    console.log('\n╔════════════════════════════════════════════╗');
    console.log('║          Test Completed!                   ║');
    console.log('╚════════════════════════════════════════════╝');
    console.log('\n⚠️  NOTE: This was a LIVE order!');
    console.log('If you want to cancel it, do so from your trading terminal.');
}

// Run the test
runTest().catch(error => {
    console.error('\n💥 Fatal error:', error);
    process.exit(1);
});

