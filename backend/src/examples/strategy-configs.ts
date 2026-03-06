/**
 * Example Strategy Configurations
 * Demonstrates different trading approaches using various indicator combinations
 */

export const EXAMPLE_STRATEGIES = {
    /**
     * Multi-Indicator Strategy
     * Combines multiple indicators for comprehensive analysis
     */
    MULTI_INDICATOR: {
        name: "Multi-Indicator Strategy",
        description: "Comprehensive strategy using SMA, EMA, RSI, MACD, Stochastic, and ADX",
        type: "CUSTOM" as const,
        symbol: "NIFTY50",
        exchangeSegment: "1",
        exchangeInstrumentID: 26000,
        timeframe: "15min",
        config: {
            entryConditions: [
                "EMA fast > EMA slow",
                "RSI > 50 and RSI < 70",
                "MACD histogram > 0",
                "Stochastic K > D",
                "ADX > 25"
            ],
            exitConditions: [
                "EMA fast < EMA slow",
                "RSI < 50",
                "MACD histogram < 0"
            ],
            indicators: {
                sma: { period: 20 },
                ema: { fast: 12, slow: 26 },
                rsi: { period: 14, overbought: 70, oversold: 30 },
                macd: { fast: 12, slow: 26, signal: 9 },
                stochastic: { period: 14, signalPeriod: 3 },
                adx: { period: 14 },
                bollingerBands: { period: 20, stdDev: 2 },
                atr: { period: 14 }
            },
            stopLoss: 2,
            takeProfit: 4,
            maxPositionSize: 100,
            maxDailyLoss: 5,
            orderType: "MARKET" as const,
            productType: "MIS" as const,
            quantity: 1,
            checkInterval: 60000 // 1 minute
        }
    },

    /**
     * Trend Following Strategy
     * Uses SuperTrend, ADX, and HalfTrend for trend detection
     */
    TREND_FOLLOWING: {
        name: "Trend Following Strategy",
        description: "Advanced trend following using SuperTrend, ADX, and HalfTrend indicators",
        type: "CUSTOM" as const,
        symbol: "BANKNIFTY",
        exchangeSegment: "1",
        exchangeInstrumentID: 26009,
        timeframe: "5min",
        config: {
            entryConditions: [
                "SuperTrend direction = LONG",
                "ADX > 30",
                "HalfTrend direction = UP",
                "Price > SuperTrend line"
            ],
            exitConditions: [
                "SuperTrend direction = SHORT",
                "HalfTrend direction = DOWN"
            ],
            indicators: {
                supertrend: { period: 10, multiplier: 3 },
                adx: { period: 14 },
                halftrend: { amplitude: 2, channelDeviation: 2 },
                atr: { period: 14 }
            },
            stopLoss: 1.5,
            takeProfit: 3,
            trailingStopLoss: 0.5,
            maxPositionSize: 50,
            maxDailyLoss: 3,
            orderType: "MARKET" as const,
            productType: "MIS" as const,
            quantity: 1,
            checkInterval: 30000 // 30 seconds
        }
    },

    /**
     * Breakout Strategy
     * Uses Opening Range Breakout with Bollinger Bands and Volume
     */
    BREAKOUT_STRATEGY: {
        name: "Breakout Strategy",
        description: "Intraday breakout strategy using ORB, Bollinger Bands, and volume indicators",
        type: "SCALPING" as const,
        symbol: "NIFTY50",
        exchangeSegment: "1",
        exchangeInstrumentID: 26000,
        timeframe: "1min",
        config: {
            entryConditions: [
                "ORB breakout = LONG",
                "Price > Bollinger Bands upper",
                "Volume > average volume",
                "RSI > 50"
            ],
            exitConditions: [
                "Price < Bollinger Bands middle",
                "RSI < 50",
                "ORB breakout = SHORT"
            ],
            indicators: {
                orb: { openingRangeMinutes: 15, breakoutThreshold: 0.5 },
                bollingerBands: { period: 20, stdDev: 2 },
                rsi: { period: 14, overbought: 70, oversold: 30 },
                vwap: true,
                obv: true,
                atr: { period: 14 }
            },
            stopLoss: 1,
            takeProfit: 2,
            maxPositionSize: 25,
            maxDailyLoss: 2,
            orderType: "MARKET" as const,
            productType: "MIS" as const,
            quantity: 1,
            tradingStartTime: "09:15",
            tradingEndTime: "15:30",
            checkInterval: 15000 // 15 seconds
        }
    },

    /**
     * Momentum Strategy
     * Uses RSI, MFI, Williams %R, and CCI for momentum analysis
     */
    MOMENTUM_STRATEGY: {
        name: "Momentum Strategy",
        description: "Momentum-based strategy using RSI, MFI, Williams %R, and CCI",
        type: "CUSTOM" as const,
        symbol: "FINNIFTY",
        exchangeSegment: "1",
        exchangeInstrumentID: 26037,
        timeframe: "10min",
        config: {
            entryConditions: [
                "RSI > 50 and RSI < 70",
                "MFI > 50 and MFI < 80",
                "Williams %R < -20",
                "CCI > 0 and CCI < 100"
            ],
            exitConditions: [
                "RSI < 50",
                "MFI < 50",
                "Williams %R > -20"
            ],
            indicators: {
                rsi: { period: 14, overbought: 70, oversold: 30 },
                mfi: { period: 14 },
                williamsR: { period: 14 },
                cci: { period: 20 },
                ema: { fast: 12, slow: 26 },
                atr: { period: 14 }
            },
            stopLoss: 2.5,
            takeProfit: 5,
            maxPositionSize: 75,
            maxDailyLoss: 4,
            orderType: "MARKET" as const,
            productType: "MIS" as const,
            quantity: 1,
            checkInterval: 60000 // 1 minute
        }
    },

    /**
     * Scalping Strategy
     * High-frequency strategy using LSMA and multiple momentum indicators
     */
    SCALPING_STRATEGY: {
        name: "Scalping Strategy",
        description: "High-frequency scalping using LSMA, Stochastic, and Williams %R",
        type: "SCALPING" as const,
        symbol: "NIFTY50",
        exchangeSegment: "1",
        exchangeInstrumentID: 26000,
        timeframe: "1min",
        config: {
            entryConditions: [
                "LSMA slope > 0",
                "Stochastic K > D",
                "Williams %R < -80",
                "Price > LSMA"
            ],
            exitConditions: [
                "LSMA slope < 0",
                "Stochastic K < D",
                "Williams %R > -20"
            ],
            indicators: {
                lsma: { period: 25 },
                stochastic: { period: 14, signalPeriod: 3 },
                williamsR: { period: 14 },
                ema: { fast: 5, slow: 10 },
                atr: { period: 14 }
            },
            stopLoss: 0.5,
            takeProfit: 1,
            maxPositionSize: 10,
            maxDailyLoss: 1,
            orderType: "MARKET" as const,
            productType: "MIS" as const,
            quantity: 1,
            tradingStartTime: "09:15",
            tradingEndTime: "15:30",
            checkInterval: 5000 // 5 seconds
        }
    },

    /**
     * Volatility Strategy
     * Uses Bollinger Bands, ATR, and VWAP for volatility-based trading
     */
    VOLATILITY_STRATEGY: {
        name: "Volatility Strategy",
        description: "Volatility-based strategy using Bollinger Bands, ATR, and VWAP",
        type: "CUSTOM" as const,
        symbol: "BANKNIFTY",
        exchangeSegment: "1",
        exchangeInstrumentID: 26009,
        timeframe: "5min",
        config: {
            entryConditions: [
                "Price touches Bollinger Bands lower",
                "ATR > average ATR",
                "Price < VWAP",
                "RSI < 30"
            ],
            exitConditions: [
                "Price reaches Bollinger Bands middle",
                "RSI > 70",
                "Price > VWAP"
            ],
            indicators: {
                bollingerBands: { period: 20, stdDev: 2 },
                atr: { period: 14 },
                vwap: true,
                rsi: { period: 14, overbought: 70, oversold: 30 },
                ema: { fast: 12, slow: 26 }
            },
            stopLoss: 1.5,
            takeProfit: 3,
            maxPositionSize: 50,
            maxDailyLoss: 3,
            orderType: "LIMIT" as const,
            productType: "MIS" as const,
            quantity: 1,
            checkInterval: 30000 // 30 seconds
        }
    }
};

/**
 * Strategy Templates for Quick Setup
 */
export const STRATEGY_TEMPLATES = {
    /**
     * Conservative Strategy Template
     */
    CONSERVATIVE: {
        indicators: {
            sma: { period: 50 },
            ema: { fast: 12, slow: 26 },
            rsi: { period: 14, overbought: 70, oversold: 30 },
            macd: { fast: 12, slow: 26, signal: 9 },
            atr: { period: 14 }
        },
        riskManagement: {
            stopLoss: 3,
            takeProfit: 6,
            maxPositionSize: 25,
            maxDailyLoss: 2
        }
    },

    /**
     * Aggressive Strategy Template
     */
    AGGRESSIVE: {
        indicators: {
            ema: { fast: 5, slow: 10 },
            rsi: { period: 14, overbought: 80, oversold: 20 },
            stochastic: { period: 14, signalPeriod: 3 },
            williamsR: { period: 14 },
            supertrend: { period: 10, multiplier: 3 }
        },
        riskManagement: {
            stopLoss: 1,
            takeProfit: 2,
            maxPositionSize: 100,
            maxDailyLoss: 5
        }
    },

    /**
     * Intraday Strategy Template
     */
    INTRADAY: {
        indicators: {
            orb: { openingRangeMinutes: 15, breakoutThreshold: 0.5 },
            vwap: true,
            bollingerBands: { period: 20, stdDev: 2 },
            rsi: { period: 14, overbought: 70, oversold: 30 },
            atr: { period: 14 }
        },
        riskManagement: {
            stopLoss: 1.5,
            takeProfit: 3,
            maxPositionSize: 50,
            maxDailyLoss: 3
        }
    }
};

/**
 * Indicator Combinations for Different Market Conditions
 */
export const INDICATOR_COMBINATIONS = {
    /**
     * Trending Market
     */
    TRENDING: [
        'ema', 'supertrend', 'adx', 'halftrend'
    ],

    /**
     * Ranging Market
     */
    RANGING: [
        'bollingerBands', 'rsi', 'stochastic', 'williamsR'
    ],

    /**
     * High Volatility
     */
    HIGH_VOLATILITY: [
        'atr', 'bollingerBands', 'vwap', 'obv'
    ],

    /**
     * Low Volatility
     */
    LOW_VOLATILITY: [
        'lsma', 'ema', 'rsi', 'mfi'
    ],

    /**
     * Breakout Detection
     */
    BREAKOUT: [
        'orb', 'bollingerBands', 'volume', 'atr'
    ],

    /**
     * Momentum Trading
     */
    MOMENTUM: [
        'rsi', 'mfi', 'williamsR', 'cci', 'stochastic'
    ]
};
