# AlgoTrade Platform - Complete Architecture Documentation

## 📋 Table of Contents
1. [Project Overview](#project-overview)
2. [Tech Stack](#tech-stack)
3. [System Architecture](#system-architecture)
4. [Project Structure](#project-structure)
5. [Core Components](#core-components)
6. [Data Flow](#data-flow)
7. [Key Workflows](#key-workflows)
8. [Database Models](#database-models)
9. [API Structure](#api-structure)
10. [WebSocket Architecture](#websocket-architecture)
11. [Broker Integration](#broker-integration)
12. [Important Concepts](#important-concepts)

---

## 🎯 Project Overview

**AlgoTrade** is an automated algorithmic trading platform that allows users to:
- Create and configure trading strategies based on technical indicators
- Monitor market data in real-time
- Execute trades automatically through broker APIs
- Manage risk with stop-loss, take-profit, and trailing stops
- Trade across multiple segments: Cash, Futures, and Options

### Key Features
- **Strategy Monitoring**: Real-time monitoring of multiple strategies simultaneously
- **Signal Generation**: Automatic BUY/SELL signals based on technical indicators
- **Trade Execution**: Automated order placement with broker APIs
- **Risk Management**: Stop-loss, take-profit, trailing stops, and daily loss limits
- **Multiple Entry Modes**: Candle close, High-Low break, Instant entry
- **Multi-Segment Trading**: Cash, Stock Futures, Index Futures, Options
- **Real-time Updates**: WebSocket-based live updates to frontend

---

## 🛠 Tech Stack

### Backend
- **Runtime**: Node.js (v18+)
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: MongoDB (Mongoose ODM)
- **Cache**: Redis (Optional)
- **WebSocket**: Socket.IO v2.2.0
- **Authentication**: JWT (JSON Web Tokens)
- **Logging**: Winston with daily rotation
- **Technical Indicators**: `technicalindicators` library
- **Broker APIs**: XTS Interactive API, XTS Market Data API, Dealer API

### Frontend
- **Framework**: Next.js 15 (React 19)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: React Hooks
- **WebSocket Client**: Socket.IO Client
- **UI Components**: Custom components with Framer Motion

---

## 🏗 System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Frontend (Next.js)                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │   Dashboard   │  │  Strategies  │  │    Trades    │         │
│  └──────┬────────┘  └──────┬───────┘  └──────┬───────┘         │
│         │                   │                  │                  │
│         └───────────────────┴──────────────────┘                 │
│                            │                                      │
│                    Socket.IO Client                               │
└────────────────────────────┼──────────────────────────────────────┘
                             │
                    ┌────────▼────────┐
                    │  Backend Server │
                    │   (Express.js)  │
                    └────────┬────────┘
                             │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
┌───────▼────────┐  ┌────────▼────────┐  ┌────────▼────────┐
│   REST API     │  │  WebSocket       │  │  Strategy       │
│   Endpoints    │  │  Server          │  │  Monitor        │
└───────┬────────┘  └────────┬────────┘  └────────┬────────┘
        │                     │                     │
        │                     │                     │
┌───────▼────────┐  ┌────────▼────────┐  ┌────────▼────────┐
│   MongoDB      │  │  Market Data     │  │  Broker APIs    │
│   Database     │  │  WebSocket       │  │  (XTS/Dealer)   │
└────────────────┘  └──────────────────┘  └─────────────────┘
```

### Architecture Layers

1. **Presentation Layer** (Frontend)
   - User interface components
   - Real-time data visualization
   - Strategy configuration forms

2. **API Layer** (Backend Controllers)
   - REST API endpoints
   - Request validation
   - Response formatting

3. **Business Logic Layer** (Services)
   - Strategy monitoring logic
   - Trade execution logic
   - Risk management
   - Market data processing

4. **Data Layer** (Models & Database)
   - MongoDB collections
   - Data persistence
   - Data validation

5. **External Integration Layer**
   - Broker API clients
   - Market data providers
   - WebSocket connections

---

## 📁 Project Structure

```
algotrade-new-website/
├── backend/                          # Backend Node.js/Express application
│   ├── src/
│   │   ├── app.ts                    # Express app configuration
│   │   ├── server.ts                 # HTTP server setup
│   │   │
│   │   ├── config/                   # Configuration files
│   │   │   ├── database.ts          # MongoDB connection
│   │   │   ├── environment.ts      # Environment variables
│   │   │   └── redis.ts             # Redis connection (optional)
│   │   │
│   │   ├── controllers/             # API route handlers
│   │   │   ├── strategy.controller.ts
│   │   │   ├── trade.controller.ts
│   │   │   ├── broker.controller.ts
│   │   │   ├── market-data.controller.ts
│   │   │   └── ...
│   │   │
│   │   ├── routes/                   # API route definitions
│   │   │   ├── strategy.routes.ts
│   │   │   ├── trade.routes.ts
│   │   │   └── ...
│   │   │
│   │   ├── models/                   # MongoDB models (Mongoose)
│   │   │   ├── Strategy.model.ts
│   │   │   ├── Trade.model.ts
│   │   │   ├── User.model.ts
│   │   │   └── ...
│   │   │
│   │   ├── services/                 # Business logic services
│   │   │   ├── broker.service.ts
│   │   │   ├── historical-data.service.ts
│   │   │   ├── market-data.service.ts
│   │   │   ├── dealer-api.service.ts
│   │   │   └── ...
│   │   │
│   │   ├── strategies/               # Strategy monitoring system
│   │   │   ├── strategy-monitor/     # Core monitoring engine
│   │   │   │   ├── strategy-monitor.service.ts  # Main service
│   │   │   │   ├── monitoring/       # Periodic checks
│   │   │   │   │   ├── start-monitoring.ts
│   │   │   │   │   ├── perform-check.ts
│   │   │   │   │   └── check-entry-signal.ts
│   │   │   │   ├── execution/        # Trade execution
│   │   │   │   │   ├── execute-entry.ts
│   │   │   │   │   └── execute-exit.ts
│   │   │   │   ├── risk-management/ # Risk controls
│   │   │   │   │   ├── check-risk.ts
│   │   │   │   │   ├── trailing-stop.ts
│   │   │   │   │   └── time-exit.ts
│   │   │   │   ├── high-low-break/   # High-Low break mode
│   │   │   │   │   ├── watcher.ts
│   │   │   │   │   ├── handle-high-low.ts
│   │   │   │   │   └── reference.ts
│   │   │   │   ├── events/           # Event handlers
│   │   │   │   │   ├── event-handlers.ts
│   │   │   │   │   └── event-setup.ts
│   │   │   │   └── types.ts          # TypeScript types
│   │   │   ├── trend-analyzer.service.ts
│   │   │   └── strategy-query.service.ts
│   │   │
│   │   ├── indicators/               # Technical indicators
│   │   │   ├── custom/
│   │   │   │   ├── supertrend.ts
│   │   │   │   ├── halftrend.ts
│   │   │   │   └── ...
│   │   │   └── index.ts
│   │   │
│   │   ├── websocket/                 # WebSocket server
│   │   │   ├── websocket.server.ts
│   │   │   ├── websocket-market-data.ts
│   │   │   └── ...
│   │   │
│   │   ├── middleware/               # Express middleware
│   │   │   ├── auth.middleware.ts
│   │   │   └── error.middleware.ts
│   │   │
│   │   └── utils/                     # Utility functions
│   │       ├── logger.ts
│   │       └── helpers.ts
│   │
│   └── package.json
│
└── src/                               # Frontend Next.js application
    ├── app/                           # Next.js app directory
    ├── components/                    # React components
    ├── lib/                           # API client libraries
    └── hooks/                         # React hooks
```

---

## 🔧 Core Components

### 1. Strategy Monitor Service (`strategy-monitor.service.ts`)

**Purpose**: Main orchestrator for strategy monitoring

**Key Responsibilities**:
- Manages all active strategy monitors
- Coordinates event handling
- Tracks daily losses
- Provides start/stop/pause/resume functionality

**Key Methods**:
```typescript
startMonitoring(strategyId)    // Start monitoring a strategy
stopMonitoring(strategyId)     // Stop monitoring
pauseStrategy(strategyId)      // Pause (keep in memory)
resumeStrategy(strategyId)     // Resume paused strategy
```

**Event System**:
- Extends `EventEmitter`
- Listens to: `signal_generated`, `stop_loss_hit`, `take_profit_hit`, `trend_flip_exit`, etc.
- Routes events to appropriate handlers

---

### 2. Monitoring System (`monitoring/`)

#### `start-monitoring.ts`
**Purpose**: Initialize strategy monitoring

**Flow**:
1. Fetch strategy from database
2. Validate market is open
3. Fetch initial historical data
4. Perform initial trend analysis
5. Check for instant entry (if enabled)
6. Set up periodic checks (interval based on timeframe)
7. Store monitor state in memory

#### `perform-check.ts`
**Purpose**: Periodic check executed every candle interval

**Flow**:
1. Fetch latest candle data
2. Update historical data
3. Re-analyze trend
4. Check for entry signals
5. Check risk management (SL/TP/Trailing Stop)
6. Update monitor state

#### `check-entry-signal.ts`
**Purpose**: Determine if entry signal should be generated

**Logic**:
- Converts trend direction to signal (UPTREND → BUY, DOWNTREND → SELL)
- Checks if position already exists (prevents duplicates)
- Handles high-low break mode vs candle close mode
- Emits `signal_generated` event if conditions met

---

### 3. Trade Execution (`execution/`)

#### `execute-entry.ts`
**Purpose**: Execute BUY/SELL order

**Flow**:
1. Clear high-low watcher (if active)
2. Check for existing position
   - If same direction: Skip (duplicate)
   - If opposite direction: Exit first (reversal trade)
3. Fetch fresh broker status
4. Validate broker connection
5. Calculate stop-loss and take-profit prices
6. Place order via broker API
7. Create Trade record in database
8. Update strategy's `currentPosition`
9. Emit WebSocket notifications

**Special Handling**:
- **Options Trading**: Resolves option instrument, calculates strike price
- **Reversal Trades**: Exits existing position before new entry
- **Order Rejections**: Creates Trade record with `status: "ERROR"`

#### `execute-exit.ts`
**Purpose**: Close existing position

**Flow**:
1. Fetch fresh broker status
2. Validate broker connection
3. Place exit order via broker API
4. Update Trade record with exit details
5. Clear strategy's `currentPosition`
6. Calculate P&L
7. Emit WebSocket notifications

---

### 4. Risk Management (`risk-management/`)

#### `check-risk.ts`
**Purpose**: Monitor open positions for risk events

**Checks**:
- **Stop Loss**: Price hit stop-loss level
- **Take Profit**: Price hit take-profit level
- **Trailing Stop**: Price moved favorably, update trailing stop
- **Trend Flip**: Position direction opposite to current trend
- **Time Exit**: Market closing time reached

**Actions**:
- Emits appropriate events (`stop_loss_hit`, `take_profit_hit`, etc.)
- Event handlers execute exits

#### `trailing-stop.ts`
**Purpose**: Update trailing stop-loss dynamically

**Logic**:
- For BUY: Trails price upward, locks in profits
- For SELL: Trails price downward, locks in profits
- Only moves in favorable direction
- Triggers exit when price reverses

---

### 5. High-Low Break System (`high-low-break/`)

**Purpose**: Entry mode where trade executes when price breaks reference candle's high/low

#### `handle-high-low.ts`
- Sets up reference candle (high/low values)
- Starts watcher for break detection

#### `watcher.ts`
- Subscribes to real-time market data via WebSocket
- Monitors LTP (Last Traded Price)
- Detects when price breaks high (BUY) or low (SELL)
- Prevents duplicate processing with `isProcessingBreak` flag
- Clears watcher after break detected
- Emits `signal_generated` event

**Key Features**:
- Prevents duplicate trades on same reference candle
- Checks position before emitting signal
- Handles trend flips with high-low break

---

### 6. Trend Analyzer (`trend-analyzer.service.ts`)

**Purpose**: Analyze market trend using technical indicators

**Indicators Supported**:
- SuperTrend
- HalfTrend
- LSMA (Least Squares Moving Average)
- Opening Range Breakout
- Custom indicators

**Output**:
```typescript
{
  direction: "UPTREND" | "DOWNTREND" | "SIDEWAYS",
  strength: number,
  confidence: number
}
```

**Usage**:
- Called during initial analysis
- Called on every periodic check
- Trend changes trigger signal generation

---

### 7. Event Handlers (`events/event-handlers.ts`)

**Purpose**: Handle events emitted by monitoring system

**Event Types**:
- `signal_generated`: New entry signal → Execute trade
- `stop_loss_hit`: Stop-loss triggered → Exit position
- `take_profit_hit`: Take-profit triggered → Exit position
- `trailing_stop_hit`: Trailing stop triggered → Exit position
- `trend_flip_exit`: Trend reversed → Exit position
- `trend_flip_with_high_low`: Trend flip with high-low break → Exit and re-enter
- `time_exit`: Market closing → Exit position

**Flow**:
1. Event emitted by monitoring system
2. Handler receives event data
3. Handler calls appropriate execution function
4. Updates database
5. Emits WebSocket notifications

---

## 🔄 Data Flow

### Strategy Start Flow

```
User clicks "Start Strategy"
    ↓
API: POST /api/strategies/:id/start
    ↓
StrategyController.startStrategy()
    ↓
StrategyMonitorService.startMonitoring(strategyId)
    ↓
start-monitoring.ts:
    1. Fetch strategy from DB
    2. Validate market open
    3. Fetch historical data
    4. Analyze trend
    5. Check instant entry
    6. Set up interval for periodic checks
    ↓
Monitor stored in memory (Map<strategyId, MonitorState>)
    ↓
Periodic checks begin (every candle interval)
```

### Signal Generation Flow

```
perform-check.ts (periodic)
    ↓
Fetch new candle data
    ↓
Update historical data
    ↓
Re-analyze trend
    ↓
check-entry-signal.ts:
    - Convert trend to signal
    - Check position exists
    - Check entry mode
    ↓
If high-low break mode:
    → handle-high-low.ts
    → Start watcher
    → Wait for break
    ↓
If candle close mode:
    → Emit signal_generated event
    ↓
handleSignal() receives event
    ↓
execute-entry.ts:
    1. Check position
    2. Validate broker
    3. Place order
    4. Create Trade record
    5. Update strategy
    ↓
WebSocket notification to frontend
```

### High-Low Break Flow

```
Signal generated (BUY/SELL)
    ↓
handle-high-low.ts:
    - Set reference candle (high/low)
    - Start watcher
    ↓
watcher.ts:
    - Subscribe to market data WebSocket
    - Monitor LTP in real-time
    ↓
Price breaks high (BUY) or low (SELL)
    ↓
Watcher detects break:
    1. Set isProcessingBreak flag
    2. Fetch fresh strategy (check position)
    3. Clear watcher
    4. Emit signal_generated event
    ↓
handleSignal() → execute-entry.ts
    ↓
Trade executed
```

### Risk Management Flow

```
perform-check.ts (periodic)
    ↓
check-risk.ts:
    - Check current price vs stop-loss
    - Check current price vs take-profit
    - Check trailing stop
    - Check trend direction
    ↓
If risk condition met:
    → Emit event (stop_loss_hit, take_profit_hit, etc.)
    ↓
Event handler receives event
    ↓
execute-exit.ts:
    1. Validate broker
    2. Place exit order
    3. Update Trade record
    4. Clear position
    5. Calculate P&L
    ↓
WebSocket notification
```

---

## 🔑 Key Workflows

### 1. Strategy Lifecycle

```
CREATE → CONFIGURE → START → MONITOR → STOP/PAUSE
   ↓         ↓         ↓        ↓          ↓
  DB      DB Update   Memory  Periodic   Memory
         (Config)    (Monitor)  Checks   (Cleanup)
```

### 2. Trade Lifecycle

```
SIGNAL → ENTRY → POSITION OPEN → RISK MONITORING → EXIT → POSITION CLOSED
  ↓        ↓          ↓              ↓              ↓          ↓
Event   Order     DB Update      Periodic      Order     DB Update
       (Broker)   (Position)     Checks       (Broker)   (P&L)
```

### 3. High-Low Break Workflow

```
SIGNAL → REFERENCE CANDLE → WATCHER START → PRICE MONITORING
  ↓            ↓                  ↓              ↓
BUY/SELL    High/Low         WebSocket      Real-time
          Set in Memory      Subscribe        LTP
                                    ↓
                            BREAK DETECTED
                                    ↓
                            CLEAR WATCHER
                                    ↓
                            EMIT SIGNAL
                                    ↓
                            EXECUTE TRADE
```

### 4. Reversal Trade Workflow

```
NEW SIGNAL (Opposite Direction)
    ↓
execute-entry.ts detects existing position
    ↓
EXIT existing position (execute-exit.ts)
    ↓
Refresh strategy from DB
    ↓
ENTER new position (execute-entry.ts)
    ↓
Position updated in DB
```

---

## 🗄 Database Models

### Strategy Model
```typescript
{
  userId: ObjectId,
  name: string,
  symbol: string,
  exchangeSegment: string,
  exchangeInstrumentID: number,
  timeframe: string,
  status: "ACTIVE" | "PAUSED" | "STOPPED",
  isMonitoring: boolean,
  config: {
    indicators: {...},
    entryMode: "candleClose" | "highLowBreak",
    instantEntry: boolean,
    stopLossPoints: number,
    targetPoints: number,
    trailingStopLoss: number,
    quantity: number,
    orderType: "MARKET" | "LIMIT",
    productType: "MIS" | "NRML" | "CNC"
  },
  currentPosition: {
    side: "BUY" | "SELL",
    entryPrice: number,
    quantity: number,
    stopLossPrice: number,
    takeProfitPrice: number,
    entryTime: Date
  } | null
}
```

### Trade Model
```typescript
{
  userId: ObjectId,
  strategyId: ObjectId,
  symbol: string,
  exchangeSegment: string,
  side: "BUY" | "SELL",
  entryPrice: number,
  exitPrice: number | null,
  entryTime: Date,
  exitTime: Date | null,
  quantity: number,
  stopLossPrice: number,
  takeProfitPrice: number,
  status: "OPEN" | "CLOSED" | "ERROR",
  profit: number,
  profitPercent: number,
  exitReason: string,
  tags: string[]
}
```

### User Model
```typescript
{
  email: string,
  password: string (hashed),
  brokerCredentials: {
    clientId: string,
    isConnected: boolean,
    broker: string
  }
}
```

---

## 🌐 API Structure

### Strategy Endpoints
```
POST   /api/strategies              # Create strategy
GET    /api/strategies              # List strategies
GET    /api/strategies/:id          # Get strategy
PUT    /api/strategies/:id          # Update strategy
DELETE /api/strategies/:id          # Delete strategy
POST   /api/strategies/:id/start    # Start monitoring
POST   /api/strategies/:id/stop     # Stop monitoring
POST   /api/strategies/:id/pause    # Pause monitoring
POST   /api/strategies/:id/resume   # Resume monitoring
POST   /api/strategies/:id/close-position  # Manual close
```

### Trade Endpoints
```
GET    /api/trades                  # List trades
GET    /api/trades/:id              # Get trade
GET    /api/trades/strategy/:id     # Get trades for strategy
```

### Broker Endpoints
```
POST   /api/broker/connect          # Connect broker
POST   /api/broker/disconnect      # Disconnect broker
GET    /api/broker/status           # Get connection status
```

### Market Data Endpoints
```
GET    /api/market-data/candles     # Get historical candles
GET    /api/market-data/quote       # Get current quote
```

---

## 🔌 WebSocket Architecture

### Server (`websocket.server.ts`)
- Socket.IO server instance
- User-based room management
- Event emission to specific users

### Events Emitted to Frontend

```typescript
// Strategy Events
"strategy_started"      // Strategy monitoring started
"strategy_stopped"      // Strategy monitoring stopped
"signal_generated"      // New entry signal
"position_opened"       // Position opened
"position_closed"       // Position closed

// Risk Events
"stop_loss_hit"         // Stop-loss triggered
"take_profit_hit"       // Take-profit triggered
"trend_flip"            // Trend reversed

// Notifications
"notification"          // General notification
```

### Market Data WebSocket (`websocket-market-data.ts`)
- Subscribes to broker's market data WebSocket
- Receives real-time quotes
- Used by high-low break watcher
- Broadcasts to subscribed clients

---

## 🏦 Broker Integration

### Broker Service (`broker.service.ts`)
**Purpose**: Manage broker connections

**Key Methods**:
- `connectBroker(userId)`: Connect user's broker account
- `disconnectBroker(userId)`: Disconnect broker
- `getBrokerStatus(userId)`: Get connection status
- Stores connection state in User model

### Dealer API Service (`dealer-api.service.ts`)
**Purpose**: Execute trades via broker API

**Key Methods**:
- `placeOrder(orderData)`: Place buy/sell order
- `modifyOrder(orderId, orderData)`: Modify existing order
- `cancelOrder(orderId)`: Cancel order
- `getPositions()`: Get current positions

### Options Trading Helper (`options-trading-helper.service.ts`)
**Purpose**: Handle options-specific logic

**Features**:
- Resolve option instrument from underlying
- Calculate strike price
- Determine Call/Put based on signal
- Handle expiry selection

---

## 📚 Important Concepts

### 1. Monitor State
In-memory state for each active strategy:
```typescript
{
  strategy: IStrategy,              // Strategy document
  historicalData: CandleData[],    // Candle history
  trendState: TrendState,          // Current trend
  lastCheckTime: number,           // Last check timestamp
  interval: NodeJS.Timeout,        // Periodic check interval
  highLowReference: {...},         // Reference candle for high-low break
  highLowWatcher: {...},           // Watcher state
  brokerClientId: string           // Broker client ID
}
```

### 2. Entry Modes

**Candle Close Mode**:
- Signal generated when candle closes
- Trade executes immediately at next candle open

**High-Low Break Mode**:
- Signal generated when price breaks reference candle's high/low
- Watcher monitors real-time price
- Trade executes when break occurs

**Instant Entry Mode**:
- Trade executes immediately when strategy starts
- Based on initial trend analysis
- Only if no position exists

### 3. Risk Management

**Stop Loss (Points)**:
- Fixed stop-loss in points
- Calculated from entry price
- BUY: entryPrice - stopLossPoints
- SELL: entryPrice + stopLossPoints

**Take Profit (Points)**:
- Fixed take-profit in points
- BUY: entryPrice + targetPoints
- SELL: entryPrice - targetPoints

**Trailing Stop Loss (%)**:
- Dynamic stop-loss that trails price
- Only moves in favorable direction
- Locks in profits as price moves favorably

**Daily Loss Limit**:
- Maximum loss per day
- Tracks cumulative losses
- Stops trading if limit reached

### 4. Event-Driven Architecture

The system uses an event-driven architecture:
- **Event Emitter**: StrategyMonitorService extends EventEmitter
- **Event Handlers**: Separate handlers for each event type
- **Decoupling**: Monitoring logic separated from execution logic
- **Scalability**: Easy to add new event types

### 5. Position Management

**Current Position**:
- Stored in Strategy model
- Updated on entry/exit
- Used to prevent duplicate trades
- Used for risk management checks

**Trade Records**:
- Separate Trade model for history
- One record per entry/exit cycle
- Tracks P&L, exit reason, timestamps

### 6. Multi-Account Support

- Each user has separate broker credentials
- Broker status checked per user
- Monitors isolated per user
- No cross-account interference

---

## 🚀 Getting Started for Developers

### 1. Setup Environment
```bash
# Install dependencies
cd backend && npm install

# Create .env file
cp .env.example .env

# Configure MongoDB URI
MONGODB_URI=mongodb://localhost:27017/algotrade

# Configure broker credentials
XTS_API_KEY=your_key
XTS_API_SECRET=your_secret
```

### 2. Start Development Server
```bash
# Backend
cd backend && npm run dev

# Frontend (separate terminal)
npm run dev
```

### 3. Key Files to Understand

**For Strategy Monitoring**:
- `strategies/strategy-monitor/strategy-monitor.service.ts`
- `strategies/strategy-monitor/monitoring/start-monitoring.ts`
- `strategies/strategy-monitor/monitoring/perform-check.ts`

**For Trade Execution**:
- `strategies/strategy-monitor/execution/execute-entry.ts`
- `strategies/strategy-monitor/execution/execute-exit.ts`

**For Risk Management**:
- `strategies/strategy-monitor/risk-management/check-risk.ts`

**For High-Low Break**:
- `strategies/strategy-monitor/high-low-break/watcher.ts`
- `strategies/strategy-monitor/high-low-break/handle-high-low.ts`

### 4. Debugging Tips

- Check logs in `backend/logs/`
- Monitor WebSocket connections
- Check MongoDB for strategy/trade records
- Verify broker connection status
- Check monitor state in memory (StrategyMonitorService)

---

## 📝 Notes

- **In-Memory State**: Monitor states are stored in memory (Map). Server restart loses active monitors.
- **Resume on Restart**: Server attempts to resume active strategies on startup.
- **Market Hours**: Trading only during market hours (9:15 AM - 3:30 PM IST).
- **Pending Trades**: Trades after 3:30 PM saved as pending, executed next day.
- **Error Handling**: Failed orders create Trade records with `status: "ERROR"`.
- **WebSocket Reconnection**: Frontend handles WebSocket reconnection automatically.

---

## 🔄 Future Enhancements

- [ ] Paper trading mode
- [ ] Backtesting engine
- [ ] Strategy templates marketplace
- [ ] Advanced order types (bracket orders, etc.)
- [ ] Multi-timeframe analysis
- [ ] Portfolio management
- [ ] Performance analytics dashboard

---

**Last Updated**: December 2025
**Version**: 1.0.0

