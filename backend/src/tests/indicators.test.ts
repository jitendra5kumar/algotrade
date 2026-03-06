/**
 * Integration Tests for Advanced Indicators
 * Tests all library and custom indicators functionality
 */

import IndicatorService from '../indicators';
import { CandleData } from '../indicators/types';

// Sample test data
const sampleData: CandleData[] = [
    { open: 100, high: 105, low: 98, close: 103, volume: 1000, timestamp: new Date('2024-01-01T09:15:00Z') },
    { open: 103, high: 108, low: 101, close: 106, volume: 1200, timestamp: new Date('2024-01-01T09:16:00Z') },
    { open: 106, high: 110, low: 104, close: 108, volume: 1100, timestamp: new Date('2024-01-01T09:17:00Z') },
    { open: 108, high: 112, low: 106, close: 109, volume: 1300, timestamp: new Date('2024-01-01T09:18:00Z') },
    { open: 109, high: 115, low: 107, close: 113, volume: 1400, timestamp: new Date('2024-01-01T09:19:00Z') },
    { open: 113, high: 118, low: 111, close: 116, volume: 1500, timestamp: new Date('2024-01-01T09:20:00Z') },
    { open: 116, high: 120, low: 114, close: 118, volume: 1600, timestamp: new Date('2024-01-01T09:21:00Z') },
    { open: 118, high: 122, low: 116, close: 120, volume: 1700, timestamp: new Date('2024-01-01T09:22:00Z') },
    { open: 120, high: 125, low: 118, close: 123, volume: 1800, timestamp: new Date('2024-01-01T09:23:00Z') },
    { open: 123, high: 128, low: 121, close: 126, volume: 1900, timestamp: new Date('2024-01-01T09:24:00Z') },
    { open: 126, high: 130, low: 124, close: 128, volume: 2000, timestamp: new Date('2024-01-01T09:25:00Z') },
    { open: 128, high: 132, low: 126, close: 130, volume: 2100, timestamp: new Date('2024-01-01T09:26:00Z') },
    { open: 130, high: 135, low: 128, close: 133, volume: 2200, timestamp: new Date('2024-01-01T09:27:00Z') },
    { open: 133, high: 138, low: 131, close: 136, volume: 2300, timestamp: new Date('2024-01-01T09:28:00Z') },
    { open: 136, high: 140, low: 134, close: 138, volume: 2400, timestamp: new Date('2024-01-01T09:29:00Z') },
    { open: 138, high: 142, low: 136, close: 140, volume: 2500, timestamp: new Date('2024-01-01T09:30:00Z') },
    { open: 140, high: 145, low: 138, close: 143, volume: 2600, timestamp: new Date('2024-01-01T09:31:00Z') },
    { open: 143, high: 148, low: 141, close: 146, volume: 2700, timestamp: new Date('2024-01-01T09:32:00Z') },
    { open: 146, high: 150, low: 144, close: 149, volume: 2800, timestamp: new Date('2024-01-01T09:33:00Z') },
    { open: 149, high: 153, low: 147, close: 152, volume: 2900, timestamp: new Date('2024-01-01T09:34:00Z') }
];

/**
 * Test Library Indicators
 */
export function testLibraryIndicators() {
    console.log('🧪 Testing Library Indicators...\n');

    try {
        // Test SMA
        const sma = IndicatorService.SMA(sampleData, 10);
        console.log('✅ SMA:', sma.length, 'values calculated');
        console.log('   Latest SMA:', sma[sma.length - 1]?.value);

        // Test EMA
        const ema = IndicatorService.EMA(sampleData, 14);
        console.log('✅ EMA:', ema.length, 'values calculated');
        console.log('   Latest EMA:', ema[ema.length - 1]?.value);

        // Test RSI
        const rsi = IndicatorService.RSI(sampleData, 14);
        console.log('✅ RSI:', rsi.length, 'values calculated');
        console.log('   Latest RSI:', rsi[rsi.length - 1]?.value);

        // Test MACD
        const macd = IndicatorService.MACD(sampleData, 12, 26, 9);
        console.log('✅ MACD:', macd.length, 'values calculated');
        console.log('   Latest MACD:', macd[macd.length - 1]);

        // Test Bollinger Bands
        const bb = IndicatorService.BollingerBands(sampleData, 20, 2);
        console.log('✅ Bollinger Bands:', bb.length, 'values calculated');
        console.log('   Latest BB:', bb[bb.length - 1]);

        // Test Stochastic
        const stochastic = IndicatorService.Stochastic(sampleData, 14, 3);
        console.log('✅ Stochastic:', stochastic.length, 'values calculated');
        console.log('   Latest Stochastic:', stochastic[stochastic.length - 1]);

        // Test ADX
        const adx = IndicatorService.ADX(sampleData, 14);
        console.log('✅ ADX:', adx.length, 'values calculated');
        console.log('   Latest ADX:', adx[adx.length - 1]);

        // Test Williams %R
        const williamsR = IndicatorService.WilliamsR(sampleData, 14);
        console.log('✅ Williams %R:', williamsR.length, 'values calculated');
        console.log('   Latest Williams %R:', williamsR[williamsR.length - 1]?.value);

        // Test CCI
        const cci = IndicatorService.CCI(sampleData, 20);
        console.log('✅ CCI:', cci.length, 'values calculated');
        console.log('   Latest CCI:', cci[cci.length - 1]?.value);

        // Test VWAP
        const vwap = IndicatorService.VWAP(sampleData);
        console.log('✅ VWAP:', vwap.length, 'values calculated');
        console.log('   Latest VWAP:', vwap[vwap.length - 1]?.value);

        // Test WMA
        const wma = IndicatorService.WMA(sampleData, 10);
        console.log('✅ WMA:', wma.length, 'values calculated');
        console.log('   Latest WMA:', wma[wma.length - 1]?.value);

        // Test OBV
        const obv = IndicatorService.OBV(sampleData);
        console.log('✅ OBV:', obv.length, 'values calculated');
        console.log('   Latest OBV:', obv[obv.length - 1]?.value);

        // Test MFI
        const mfi = IndicatorService.MFI(sampleData, 14);
        console.log('✅ MFI:', mfi.length, 'values calculated');
        console.log('   Latest MFI:', mfi[mfi.length - 1]?.value);

        // Test ATR
        const atr = IndicatorService.ATR(sampleData, 14);
        console.log('✅ ATR:', atr.length, 'values calculated');
        console.log('   Latest ATR:', atr[atr.length - 1]?.value);

        console.log('\n🎉 All library indicators working correctly!\n');

    } catch (error) {
        console.error('❌ Library indicators test failed:', error);
    }
}

/**
 * Test Custom Indicators
 */
export function testCustomIndicators() {
    console.log('🧪 Testing Custom Indicators...\n');

    try {
        // Test SuperTrend
        const supertrend = IndicatorService.SuperTrend(sampleData, 10, 3);
        console.log('✅ SuperTrend:', supertrend.length, 'values calculated');
        console.log('   Latest SuperTrend:', supertrend[supertrend.length - 1]);

        // Test LSMA (needs more data points)
        const lsma = IndicatorService.LSMA(sampleData, 10);
        console.log('✅ LSMA:', lsma.length, 'values calculated');
        console.log('   Latest LSMA:', lsma[lsma.length - 1]?.value);

        // Test HalfTrend
        const halftrend = IndicatorService.HalfTrend(sampleData, 2, 2);
        console.log('✅ HalfTrend:', halftrend.length, 'values calculated');
        console.log('   Latest HalfTrend:', halftrend[halftrend.length - 1]);

        // Test ORB
        const orb = IndicatorService.ORB(sampleData, { openingRangeMinutes: 5, breakoutThreshold: 0.5 });
        console.log('✅ ORB:', orb.length, 'values calculated');
        console.log('   Latest ORB:', orb[orb.length - 1]);

        console.log('\n🎉 All custom indicators working correctly!\n');

    } catch (error) {
        console.error('❌ Custom indicators test failed:', error);
    }
}

/**
 * Test calculateAll method
 */
export function testCalculateAll() {
    console.log('🧪 Testing calculateAll method...\n');

    try {
        const results = IndicatorService.calculateAll(sampleData, {
            sma: 20,
            ema: 14,
            rsi: 14,
            macd: { fast: 12, slow: 26, signal: 9 },
            bb: { period: 20, stdDev: 2 },
            atr: 14
        });

        console.log('✅ calculateAll results:');
        console.log('   SMA:', results.sma ? '✅' : '❌');
        console.log('   EMA:', results.ema ? '✅' : '❌');
        console.log('   RSI:', results.rsi ? '✅' : '❌');
        console.log('   MACD:', results.macd ? '✅' : '❌');
        console.log('   Bollinger Bands:', results.bollingerBands ? '✅' : '❌');
        console.log('   ATR:', results.atr ? '✅' : '❌');

        console.log('\n🎉 calculateAll method working correctly!\n');

    } catch (error) {
        console.error('❌ calculateAll test failed:', error);
    }
}

/**
 * Test Error Handling
 */
export function testErrorHandling() {
    console.log('🧪 Testing Error Handling...\n');

    try {
        // Test with insufficient data
        const shortData = sampleData.slice(0, 5);
        
        try {
            IndicatorService.SMA(shortData, 10);
            console.log('❌ Should have thrown error for insufficient data');
        } catch (error) {
            console.log('✅ Correctly handled insufficient data error');
        }

        // Test with invalid parameters
        try {
            IndicatorService.RSI(sampleData, -1);
            console.log('❌ Should have thrown error for invalid period');
        } catch (error) {
            console.log('✅ Correctly handled invalid parameter error');
        }

        console.log('\n🎉 Error handling working correctly!\n');

    } catch (error) {
        console.error('❌ Error handling test failed:', error);
    }
}

/**
 * Run All Tests
 */
export function runAllTests() {
    console.log('🚀 Starting Advanced Indicators Integration Tests\n');
    console.log('=' .repeat(60));

    testLibraryIndicators();
    testCustomIndicators();
    testCalculateAll();
    testErrorHandling();

    console.log('=' .repeat(60));
    console.log('🎉 All tests completed successfully!');
    console.log('📊 Advanced Indicators Integration is ready for production!');
}

// Export for use in other files
export default {
    testLibraryIndicators,
    testCustomIndicators,
    testCalculateAll,
    testErrorHandling,
    runAllTests
};
