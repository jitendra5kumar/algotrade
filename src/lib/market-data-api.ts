// @ts-nocheck
import api from './api';

/**
 * Market Data API functions for fetching live market data
 */

/**
 * Get live quotes for multiple instruments
 */
export const getLiveQuotes = async (instruments) => {
  try {
    const response = await api.post('/api/market-data/quotes', {
      instruments: instruments.map(instrument => ({
        exchangeSegment: instrument.exchangeSegment || 2, // Default to NSE Cash
        exchangeInstrumentID: instrument.exchangeInstrumentID || instrument.instrumentToken
      }))
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching live quotes:', error);
    throw new Error(error.message || 'Failed to fetch live quotes');
  }
};

/**
 * Get live quote for a single instrument
 */
export const getLiveQuote = async (instrument) => {
  try {
    const response = await api.post('/api/market-data/quotes', {
      instruments: [{
        exchangeSegment: instrument.exchangeSegment || 2,
        exchangeInstrumentID: instrument.exchangeInstrumentID || instrument.instrumentToken
      }]
    });
    
    if (response.data && response.data.data && response.data.data.length > 0) {
      return response.data.data[0];
    }
    return null;
  } catch (error) {
    console.error('Error fetching live quote:', error);
    return null;
  }
};

/**
 * Get historical data for an instrument
 */
export const getHistoricalData = async (instrument, timeframe = '15min', days = 1) => {
  try {
    const endTime = new Date();
    const startTime = new Date();
    startTime.setDate(startTime.getDate() - days);

    const response = await api.post('/api/market-data/historical', {
      exchangeSegment: instrument.exchangeSegment || 2,
      exchangeInstrumentID: instrument.exchangeInstrumentID || instrument.instrumentToken,
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      timeframe: timeframe
    });
    
    return response.data;
  } catch (error) {
    console.error('Error fetching historical data:', error);
    throw new Error(error.message || 'Failed to fetch historical data');
  }
};

const marketDataApi = {
  getLiveQuotes,
  getLiveQuote,
  getHistoricalData
};

export default marketDataApi;
