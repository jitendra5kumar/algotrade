// Re-export types from strategy.types
export type { TrendState, StrategyExecutionResult } from './strategy.types';

// Indicator value types
export interface IndicatorValue {
    value: number;
    timestamp?: string;
}

export interface MACDValue {
    macd: number;
    signal: number;
    histogram: number;
    timestamp?: string;
}

export interface BollingerBandValue {
    upper: number;
    middle: number;
    lower: number;
    timestamp?: string;
}

export interface StochasticValue {
    k: number;
    d: number;
    timestamp?: string;
}

export interface ADXValue {
    adx: number;
    pdi: number;
    mdi: number;
    timestamp?: string;
}

export interface VWAPValue {
    value: number;
    timestamp?: string;
}

export interface EMAIndicator {
    // For single standalone EMA
    value?: IndicatorValue[];
    // For crossover (fast and slow)
    fast?: IndicatorValue[];
    slow?: IndicatorValue[];
}

export interface IndicatorData {
    sma?: IndicatorValue[];
    ema?: EMAIndicator;
    rsi?: IndicatorValue[];
    macd?: MACDValue[];
    bollingerBands?: BollingerBandValue[];
    atr?: IndicatorValue[];
    stochastic?: StochasticValue[];
    adx?: ADXValue[];
    williamsR?: IndicatorValue[];
    cci?: IndicatorValue[];
    psar?: IndicatorValue[];
    vwap?: IndicatorValue[];
    wma?: IndicatorValue[];
    obv?: IndicatorValue[];
    mfi?: IndicatorValue[];
    lsma?: IndicatorValue[];
}

// Indicator configuration types
export interface SMAConfig {
    period: number;
}

export interface EMAConfig {
    // For single standalone EMA - just specify period
    period?: number;
    // For crossover - specify both fast and slow
    fast?: number;
    slow?: number;
}

export interface RSIConfig {
    period: number;
    overbought?: number;
    oversold?: number;
}

export interface MACDConfig {
    fast?: number;
    slow?: number;
    signal?: number;
}

export interface BollingerBandsConfig {
    period?: number;
    stdDev?: number;
}

export interface ATRConfig {
    period?: number;
}

export interface StochasticConfig {
    period?: number;
    signalPeriod?: number;
}

export interface ADXConfig {
    period?: number;
}

export interface WilliamsRConfig {
    period?: number;
}

export interface CCIConfig {
    period?: number;
}

export interface PSARConfig {
    step?: number;
    max?: number;
}

export interface IndicatorConfig {
    sma?: SMAConfig;
    ema?: EMAConfig;
    rsi?: RSIConfig;
    macd?: MACDConfig;
    bollingerBands?: BollingerBandsConfig;
    atr?: ATRConfig;
    stochastic?: StochasticConfig;
    adx?: ADXConfig;
    williamsR?: WilliamsRConfig;
    cci?: CCIConfig;
    psar?: PSARConfig;
    vwap?: boolean;
    wma?: { period: number };
    obv?: boolean;
    mfi?: { period?: number };
    lsma?: { period?: number };
}
