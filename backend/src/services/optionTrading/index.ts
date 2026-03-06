/**
 * Option Trading Services
 * 
 * This module provides services for option trading functionality:
 * - Option symbol generation (rounding prices, creating option symbols)
 * - Option instrument resolution (finding option instruments in XTS database)
 * - Option trading execution (placing orders, managing positions)
 * - Option signal generation (analyzing index data and generating signals)
 */

export { default as optionSymbolGenerator } from './option-symbol-generator.service';
export { default as optionInstrumentResolver } from './option-instrument-resolver.service';
export { default as optionTradingExecution } from './option-trading-execution.service';
export { default as optionSignalGenerator } from './option-signal-generator.service';

