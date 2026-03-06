/**
 * Technical Indicators Integration
 * Using technicalindicators library
 */

import * as TI from 'technicalindicators';
import { 
    CandleData, 
    IndicatorResult, 
    MACDResult, 
    RSIResult, 
    BollingerBandsResult,
    StochasticResult,
    ATRResult,
    ADXResult,
    extractPrices,
    validateCandleData,
    PriceSource
} from './types';
import { SuperTrend, LSMA, HalfTrend, OpeningRangeBreakout } from './custom';

class IndicatorService {
    /**
     * Simple Moving Average (SMA)
     */
    public SMA(
        data: CandleData[], 
        period: number, 
        source: PriceSource = 'close'
    ): IndicatorResult[] {
        if (!validateCandleData(data)) {
            throw new Error('Invalid candle data');
        }

        const values = extractPrices(data, source);
        const sma = TI.SMA.calculate({ period, values });

        return sma.map((value, index) => ({
            value,
            timestamp: data[data.length - sma.length + index].timestamp
        }));
    }

    /**
     * Exponential Moving Average (EMA)
     */
    public EMA(
        data: CandleData[], 
        period: number, 
        source: PriceSource = 'close'
    ): IndicatorResult[] {
        if (!validateCandleData(data)) {
            throw new Error('Invalid candle data');
        }

        const values = extractPrices(data, source);
        const ema = TI.EMA.calculate({ period, values });

        return ema.map((value, index) => ({
            value,
            timestamp: data[data.length - ema.length + index].timestamp
        }));
    }

    /**
     * Weighted Moving Average (WMA)
     */
    public WMA(
        data: CandleData[], 
        period: number, 
        source: PriceSource = 'close'
    ): IndicatorResult[] {
        if (!validateCandleData(data)) {
            throw new Error('Invalid candle data');
        }

        const values = extractPrices(data, source);
        const wma = TI.WMA.calculate({ period, values });

        return wma.map((value, index) => ({
            value,
            timestamp: data[data.length - wma.length + index].timestamp
        }));
    }

    /**
     * Relative Strength Index (RSI)
     */
    public RSI(
        data: CandleData[], 
        period: number = 14,
        overbought: number = 70,
        oversold: number = 30
    ): RSIResult[] {
        if (!validateCandleData(data)) {
            throw new Error('Invalid candle data');
        }

        const values = extractPrices(data, 'close');
        const rsi = TI.RSI.calculate({ period, values });

        return rsi.map((value, index) => ({
            value,
            overbought: value > overbought,
            oversold: value < oversold,
            timestamp: data[data.length - rsi.length + index].timestamp
        }));
    }

    /**
     * MACD (Moving Average Convergence Divergence)
     */
    public MACD(
        data: CandleData[],
        fastPeriod: number = 12,
        slowPeriod: number = 26,
        signalPeriod: number = 9
    ): MACDResult[] {
        if (!validateCandleData(data)) {
            throw new Error('Invalid candle data');
        }

        const values = extractPrices(data, 'close');
        const macd = TI.MACD.calculate({
            values,
            fastPeriod,
            slowPeriod,
            signalPeriod,
            SimpleMAOscillator: false,
            SimpleMASignal: false
        });

        return macd.map((item, index) => ({
            MACD: item.MACD || 0,
            signal: item.signal || 0,
            histogram: item.histogram || 0,
            timestamp: data[data.length - macd.length + index].timestamp
        }));
    }

    /**
     * Bollinger Bands
     */
    public BollingerBands(
        data: CandleData[],
        period: number = 20,
        stdDev: number = 2
    ): BollingerBandsResult[] {
        if (!validateCandleData(data)) {
            throw new Error('Invalid candle data');
        }

        const values = extractPrices(data, 'close');
        const bb = TI.BollingerBands.calculate({
            period,
            values,
            stdDev
        });

        return bb.map((item, index) => ({
            upper: item.upper,
            middle: item.middle,
            lower: item.lower,
            timestamp: data[data.length - bb.length + index].timestamp
        }));
    }

    /**
     * Stochastic Oscillator
     */
    public Stochastic(
        data: CandleData[],
        period: number = 14,
        signalPeriod: number = 3
    ): StochasticResult[] {
        if (!validateCandleData(data)) {
            throw new Error('Invalid candle data');
        }

        const high = data.map(d => d.high);
        const low = data.map(d => d.low);
        const close = data.map(d => d.close);

        const stochastic = TI.Stochastic.calculate({
            high,
            low,
            close,
            period,
            signalPeriod
        });

        return stochastic.map((item, index) => ({
            k: item.k,
            d: item.d,
            timestamp: data[data.length - stochastic.length + index].timestamp
        }));
    }

    /**
     * Average True Range (ATR)
     */
    public ATR(
        data: CandleData[],
        period: number = 14
    ): ATRResult[] {
        if (!validateCandleData(data)) {
            throw new Error('Invalid candle data');
        }

        const high = data.map(d => d.high);
        const low = data.map(d => d.low);
        const close = data.map(d => d.close);

        const atr = TI.ATR.calculate({
            high,
            low,
            close,
            period
        });

        return atr.map((value, index) => ({
            value,
            atr: value,
            timestamp: data[data.length - atr.length + index].timestamp
        }));
    }

    /**
     * Average Directional Index (ADX)
     */
    public ADX(
        data: CandleData[],
        period: number = 14
    ): ADXResult[] {
        if (!validateCandleData(data)) {
            throw new Error('Invalid candle data');
        }

        const high = data.map(d => d.high);
        const low = data.map(d => d.low);
        const close = data.map(d => d.close);

        const adx = TI.ADX.calculate({
            high,
            low,
            close,
            period
        });

        return adx.map((item, index) => ({
            adx: item.adx,
            pdi: item.pdi,
            mdi: item.mdi,
            timestamp: data[data.length - adx.length + index].timestamp
        }));
    }

    /**
     * Volume Weighted Average Price (VWAP)
     */
    public VWAP(data: CandleData[]): IndicatorResult[] {
        if (!validateCandleData(data)) {
            throw new Error('Invalid candle data');
        }

        const high = data.map(d => d.high);
        const low = data.map(d => d.low);
        const close = data.map(d => d.close);
        const volume = data.map(d => d.volume);

        const vwap = TI.VWAP.calculate({
            high,
            low,
            close,
            volume
        });

        return vwap.map((value, index) => ({
            value,
            timestamp: data[index].timestamp
        }));
    }

    /**
     * Parabolic SAR
     */
    public PSAR(
        data: CandleData[],
        step: number = 0.02,
        max: number = 0.2
    ): IndicatorResult[] {
        if (!validateCandleData(data)) {
            throw new Error('Invalid candle data');
        }

        const high = data.map(d => d.high);
        const low = data.map(d => d.low);

        const psar = TI.PSAR.calculate({
            high,
            low,
            step,
            max
        });

        return psar.map((value, index) => ({
            value,
            timestamp: data[index].timestamp
        }));
    }

    /**
     * Commodity Channel Index (CCI)
     */
    public CCI(
        data: CandleData[],
        period: number = 20
    ): IndicatorResult[] {
        if (!validateCandleData(data)) {
            throw new Error('Invalid candle data');
        }

        const high = data.map(d => d.high);
        const low = data.map(d => d.low);
        const close = data.map(d => d.close);

        const cci = TI.CCI.calculate({
            high,
            low,
            close,
            period
        });

        return cci.map((value, index) => ({
            value,
            timestamp: data[data.length - cci.length + index].timestamp
        }));
    }

    /**
     * Williams %R
     */
    public WilliamsR(
        data: CandleData[],
        period: number = 14
    ): IndicatorResult[] {
        if (!validateCandleData(data)) {
            throw new Error('Invalid candle data');
        }

        const high = data.map(d => d.high);
        const low = data.map(d => d.low);
        const close = data.map(d => d.close);

        const williamsr = TI.WilliamsR.calculate({
            high,
            low,
            close,
            period
        });

        return williamsr.map((value, index) => ({
            value,
            timestamp: data[data.length - williamsr.length + index].timestamp
        }));
    }

    /**
     * On-Balance Volume (OBV)
     */
    public OBV(data: CandleData[]): IndicatorResult[] {
        if (!validateCandleData(data)) {
            throw new Error('Invalid candle data');
        }

        const close = data.map(d => d.close);
        const volume = data.map(d => d.volume);

        const obv = TI.OBV.calculate({
            close,
            volume
        });

        return obv.map((value, index) => ({
            value,
            timestamp: data[index].timestamp
        }));
    }

    /**
     * Money Flow Index (MFI)
     */
    public MFI(
        data: CandleData[],
        period: number = 14
    ): IndicatorResult[] {
        if (!validateCandleData(data)) {
            throw new Error('Invalid candle data');
        }

        const high = data.map(d => d.high);
        const low = data.map(d => d.low);
        const close = data.map(d => d.close);
        const volume = data.map(d => d.volume);

        const mfi = TI.MFI.calculate({
            high,
            low,
            close,
            volume,
            period
        });

        return mfi.map((value, index) => ({
            value,
            timestamp: data[data.length - mfi.length + index].timestamp
        }));
    }

    /**
     * Calculate multiple indicators at once
     */
    public calculateAll(
        data: CandleData[],
        config: {
            sma?: number;
            ema?: number;
            rsi?: number;
            macd?: { fast: number; slow: number; signal: number };
            bb?: { period: number; stdDev: number };
            atr?: number;
        }
    ) {
        const results: Record<string, unknown> = {};

        if (config.sma) {
            results.sma = this.SMA(data, config.sma);
        }

        if (config.ema) {
            results.ema = this.EMA(data, config.ema);
        }

        if (config.rsi) {
            results.rsi = this.RSI(data, config.rsi);
        }

        if (config.macd) {
            results.macd = this.MACD(
                data,
                config.macd.fast,
                config.macd.slow,
                config.macd.signal
            );
        }

        if (config.bb) {
            results.bollingerBands = this.BollingerBands(
                data,
                config.bb.period,
                config.bb.stdDev
            );
        }

        if (config.atr) {
            results.atr = this.ATR(data, config.atr);
        }

        return results;
    }

    /**
     * SuperTrend Indicator
     */
    public SuperTrend(
        data: CandleData[],
        period: number = 10,
        multiplier: number = 3
    ) {
        return SuperTrend.calculate(data, period, multiplier);
    }

    /**
     * Least Squares Moving Average (LSMA)
     */
    public LSMA(data: CandleData[], period: number = 25) {
        return LSMA.calculate(data, period);
    }

    /**
     * HalfTrend Indicator
     */
    public HalfTrend(
        data: CandleData[],
        amplitude: number = 2,
        channelDeviation: number = 2
    ) {
        return HalfTrend.calculate(data, amplitude, channelDeviation);
    }

    /**
     * Opening Range Breakout (ORB)
     */
    public ORB(data: CandleData[], config?: any) {
        return OpeningRangeBreakout.calculate(data, config);
    }
}

export default new IndicatorService();

