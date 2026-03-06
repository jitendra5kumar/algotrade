# Test Scripts for Trade Execution

## 📁 Available Scripts

### 1. `test-trade-safe.js` (Recommended for first test)
**Safe mode** - Only validates connection, NO actual order placement

```bash
node test-trade-safe.js <CLIENT_ID>
```

**Example:**
```bash
node test-trade-safe.js ON190
```

**What it does:**
- ✅ Connects to Dealer API
- ✅ Shows your current orders
- ✅ Shows your current positions
- ✅ Shows your balance
- ✅ Simulates what order would look like
- ❌ Does NOT place any order

---

### 2. `test-trade.js` (Live Order - Use with caution)
**Live mode** - Places ACTUAL order for SBIN-EQ

```bash
node test-trade.js <CLIENT_ID>
```

**Example:**
```bash
node test-trade.js ON190
```

**What it does:**
- ✅ Connects to Dealer API
- ✅ Places a LIVE BUY order for SBIN-EQ
  - Quantity: 1 share
  - Order Type: MARKET
  - Product Type: MIS (Intraday)
- ✅ Shows order confirmation
- ✅ Verifies order in orderbook

**⚠️ WARNING:** This places a REAL order on the exchange!

---

## 🚀 How to Use

### Step 1: Make sure backend .env is configured
```bash
DEALER_API_BASE_URL=https://xts.compositedge.com
INTERACTIVE_API_KEY=your_key_here
INTERACTIVE_API_SECRET=your_secret_here
INTERACTIVE_SOURCE=WebAPI
```

### Step 2: Run safe test first (Recommended)
```bash
cd backend
node test-trade-safe.js YOUR_CLIENT_ID
```

### Step 3: If safe test passes, run live test
```bash
node test-trade.js YOUR_CLIENT_ID
```

---

## 📊 Expected Output

### Safe Test Output:
```
╔════════════════════════════════════════════╗
║     Safe Test - Connection Validation     ║
╚════════════════════════════════════════════╝

👤 Testing with Client ID: ON190

📡 Connecting to Dealer API...
✅ Login successful!
UserID: DEALER123

📋 Fetching orderbook...
✅ Found 3 order(s) in orderbook

📊 Fetching positions...
✅ Found 1 position(s)

💰 Fetching balance...
✅ Balance fetched successfully
   Available Cash: ₹50000
   Used Margin: ₹10000

╔════════════════════════════════════════════╗
║      Test Order Simulation (SBIN-EQ)      ║
╚════════════════════════════════════════════╝

📋 Order payload that WOULD be sent:
{
  "exchangeSegment": "NSECM",
  "exchangeInstrumentID": 3045,
  "productType": "MIS",
  "orderType": "MARKET",
  "orderSide": "BUY",
  "timeInForce": "DAY",
  "disclosedQuantity": 0,
  "orderQuantity": 1,
  "limitPrice": 0,
  "stopPrice": 0,
  "orderUniqueIdentifier": "TEST-XXXXXXXXXX",
  "clientID": "YOUR_CLIENT_ID"
}

📋 Human Readable:
   Symbol: SBIN-EQ
   Exchange Instrument ID: 3045
   Exchange Segment: NSECM
   Side: BUY
   Quantity: 1
   Order Type: MARKET
   Product Type: MIS (Intraday)

⚠️  NOTE: This is a SIMULATION only!
   No actual order was placed.

╔════════════════════════════════════════════╗
║     Safe Test Completed Successfully!     ║
╚════════════════════════════════════════════╝

✅ All connections working properly!
✅ Ready for live trading!
```

### Live Test Output:
```
╔════════════════════════════════════════════╗
║   SBIN-EQ Trade Execution Test Script     ║
╚════════════════════════════════════════════╝

👤 Testing with Client ID: ON190

📡 Connecting to Dealer API...
✅ Login successful!
UserID: DEALER123

📈 Placing test order for SBIN-EQ...
Order Details:
  Symbol: SBIN-EQ
  Exchange Segment: NSECM
  Exchange Instrument ID: 3045
  Side: BUY
  Quantity: 1
  Order Type: MARKET
  Product Type: MIS

✅ Order placed successfully!

🎯 Order ID: 1234567890

📋 Fetching orderbook to verify...
✅ Orderbook fetched successfully!

📊 Found 1 SBIN-EQ order(s):

Order 1:
  Order ID: 1234567890
  Status: Filled
  Side: BUY
  Quantity: 1
  Price: 785.50

╔════════════════════════════════════════════╗
║          Test Completed!                   ║
╚════════════════════════════════════════════╝

⚠️  NOTE: This was a LIVE order!
If you want to cancel it, do so from your trading terminal.
```

---

## 🔍 Troubleshooting

### Error: "Missing API credentials"
**Solution:** Check your backend/.env file has:
```
INTERACTIVE_API_KEY=...
INTERACTIVE_API_SECRET=...
```

### Error: "Client ID is required"
**Solution:** Pass your client ID:
```bash
node test-trade-safe.js YOUR_CLIENT_ID
```

### Error: "Login failed"
**Solution:** 
- Verify API credentials in .env
- Check DEALER_API_BASE_URL is correct
- Ensure API keys are active

### Error: "Order placement failed"
**Possible reasons:**
- Market is closed
- Insufficient balance
- Invalid client ID
- API credentials issue

---

## 📝 Notes

1. **Safe Test First**: Always run `test-trade-safe.js` first to validate connection
2. **Live Trading**: `test-trade.js` places REAL orders - use carefully
3. **Intraday Only**: Test order uses MIS (Intraday) product type
4. **Market Hours**: Order will only be placed during market hours
5. **Single Share**: Test order is for just 1 share to minimize cost

---

## 🎯 Testing Checklist

- [ ] Backend .env configured with valid credentials
- [ ] Ran safe test successfully
- [ ] Verified orderbook/positions/balance display correctly
- [ ] Market is open (9:15 AM - 3:30 PM)
- [ ] Have sufficient balance
- [ ] Ready to place live test order

---

## 🆘 Need Help?

If tests fail:
1. Check backend logs: `backend/logs/combined.log`
2. Verify API credentials
3. Ensure market is open
4. Check client ID is correct
5. Contact support if issue persists

