import websocketMarketDataService from '../services/websocket-market-data.service';
import logger from '../utils/logger';
import { InstrumentMapping } from './websocket.types';
import { WebSocketEmitters } from './websocket-emitters';

export class WebSocketMarketData {
    private isMarketDataStreaming: boolean = false;
    private brokerSubscriptionId: string | null = null;
    private _loggedMissingSubscriptions?: Set<string>; // Track logged missing subscriptions to avoid spam

    constructor(
        private marketDataSubscriptions: Map<string, Set<string>>,
        private symbolToInstrumentMap: Map<string, InstrumentMapping>,
        private instrumentToSymbolMap: Map<number, string>,
        private emitters: WebSocketEmitters
    ) {}

    /**
     * Start market data streaming
     */
    public async startMarketDataStreaming(): Promise<void> {
        logger.info('Starting market data streaming');
        const symbols = Array.from(this.marketDataSubscriptions.keys());
        if (symbols.length === 0) {
            logger.warn('No symbols to subscribe to');
            return;
        }
        logger.info('Starting market data streaming', { symbols });

        try {
            // Get unique instruments from symbol mappings
            const instrumentsMap = new Map<string, { exchangeSegment: number, exchangeInstrumentID: number }>();
            const missingSymbols: string[] = [];
            
            symbols.forEach(symbol => {
                // Try exact match first
                let instrument = this.symbolToInstrumentMap.get(symbol);
                
                // If not found, try case-insensitive lookup
                if (!instrument) {
                    for (const [mapSymbol, mapInstrument] of this.symbolToInstrumentMap.entries()) {
                        if (mapSymbol.toUpperCase() === symbol.toUpperCase()) {
                            instrument = mapInstrument;
                            logger.info('Found instrument via case-insensitive lookup', {
                                requested: symbol,
                                found: mapSymbol,
                                exchangeSegment: instrument.exchangeSegment,
                                exchangeInstrumentID: instrument.exchangeInstrumentID,
                            });
                            break;
                        }
                    }
                }
                
                if (instrument) {
                    const key = `${instrument.exchangeSegment}_${instrument.exchangeInstrumentID}`;
                    instrumentsMap.set(key, instrument);
                    logger.info('Symbol mapped to instrument', {
                        symbol,
                        exchangeSegment: instrument.exchangeSegment,
                        exchangeInstrumentID: instrument.exchangeInstrumentID,
                        fullSymbolName: instrument.fullSymbolName
                    });
                } else {
                    logger.warn('Symbol not found in map, will lookup in database', { symbol });
                    missingSymbols.push(symbol);
                }
            });

            // If there are missing symbols, try to fetch them from database
            if (missingSymbols.length > 0) {
                await this.lookupMissingSymbolsInDatabase(missingSymbols, instrumentsMap);
            }

            let instruments = Array.from(instrumentsMap.values());
            
            logger.info('Instrument mapping summary', {
                totalSymbols: symbols.length,
                mappedInstruments: instruments.length,
                missingSymbols: missingSymbols.length,
                instruments: instruments.map(i => ({
                    exchangeSegment: i.exchangeSegment,
                    exchangeInstrumentID: i.exchangeInstrumentID
                })),
                missingSymbolsList: missingSymbols
            });
            
            if (instruments.length === 0) {
                logger.warn('No valid instruments found for market data streaming', { 
                    symbols,
                    missingSymbols: missingSymbols.length
                });
                return;
            }

            // Start broker WebSocket connection if not already started
            if (!websocketMarketDataService.isActive()) {
                logger.info('Starting broker WebSocket connection');
                await websocketMarketDataService.start();
                logger.info('Broker WebSocket connection started');
            }

            // Don't unsubscribe - just add new instruments to existing subscription
            // The subscribeWithCallback method will automatically handle:
            // 1. Tracking which instruments are already subscribed
            // 2. Only sending subscription request for NEW instruments
            // 3. Reusing existing broker subscriptions for already-subscribed instruments
            if (this.isMarketDataStreaming && this.brokerSubscriptionId) {
                logger.info('Adding new instruments to existing subscription', {
                    totalInstruments: instruments.length,
                    symbols: symbols.length,
                    existingSubscriptionId: this.brokerSubscriptionId
                });
                
                // Just create a new subscription with all instruments
                // The service layer will automatically deduplicate and only subscribe to new ones
                // Keep the old subscription ID for tracking, but create new one with all instruments
                const newSubscriptionId = await websocketMarketDataService.subscribeWithCallback(
                    'websocket_server',
                    instruments,
                    (quoteData: Record<string, unknown>) => {
                        this.handleBrokerQuoteUpdate(quoteData);
                    }
                );
                
                // Update subscription ID (old one will be cleaned up automatically by service)
                this.brokerSubscriptionId = newSubscriptionId;
            } else {
                // First time subscription
                this.brokerSubscriptionId = await websocketMarketDataService.subscribeWithCallback(
                    'websocket_server',
                    instruments,
                    (quoteData: Record<string, unknown>) => {
                        this.handleBrokerQuoteUpdate(quoteData);
                    }
                );
            }

            this.isMarketDataStreaming = true;
            logger.info(`Market data streaming started for ${instruments.length} instruments`, {
                subscriptionId: this.brokerSubscriptionId,
                instruments: instruments.map(i => ({
                    exchangeSegment: i.exchangeSegment,
                    exchangeInstrumentID: i.exchangeInstrumentID
                })),
                symbols: symbols,
                missingSymbolsResolved: missingSymbols.length,
                totalSymbols: symbols.length
            });

        } catch (error: any) {
            logger.error('Error starting market data streaming:', error);
            this.isMarketDataStreaming = false;
            this.brokerSubscriptionId = null;
        }
    }

    /**
     * Lookup missing symbols in database
     */
    private async lookupMissingSymbolsInDatabase(
        missingSymbols: string[],
        instrumentsMap: Map<string, { exchangeSegment: number, exchangeInstrumentID: number }>
    ): Promise<void> {
        logger.info('Looking up missing symbols in database', {
            missingSymbols,
            totalSymbols: Array.from(this.marketDataSubscriptions.keys()).length,
            mappedSymbols: Array.from(this.marketDataSubscriptions.keys()).length - missingSymbols.length
        });

        try {
            const XtsInstrument = (await import('../models/XtsInstrument.model')).default;
            const IndexInstrument = (await import('../models/IndexInstrument.model')).default;
            const exchangeSegments = [1, 2, 3, 11, 12, 51];
            
            for (const symbol of missingSymbols) {
                let found = false;
                
                for (const exchangeSegment of exchangeSegments) {
                    try {
                        const instrument = await XtsInstrument.findOne({
                            name: { $regex: new RegExp(`^${symbol}$`, 'i') },
                            exchangeSegment: exchangeSegment
                        }).select('name exchangeSegment exchangeInstrumentID').lean();

                        if (instrument && (instrument as any).exchangeInstrumentID) {
                            const fullSymbolName = (instrument as any).name || symbol;
                            
                            this.symbolToInstrumentMap.set(symbol, {
                                exchangeSegment: (instrument as any).exchangeSegment,
                                exchangeInstrumentID: (instrument as any).exchangeInstrumentID,
                                fullSymbolName: fullSymbolName
                            });
                            
                            this.instrumentToSymbolMap.set(
                                (instrument as any).exchangeInstrumentID,
                                fullSymbolName
                            );
                            
                            const key = `${(instrument as any).exchangeSegment}_${(instrument as any).exchangeInstrumentID}`;
                            instrumentsMap.set(key, {
                                exchangeSegment: (instrument as any).exchangeSegment,
                                exchangeInstrumentID: (instrument as any).exchangeInstrumentID
                            });
                            
                            logger.info('Found and mapped missing symbol', {
                                symbol,
                                exchangeSegment: (instrument as any).exchangeSegment,
                                exchangeInstrumentID: (instrument as any).exchangeInstrumentID,
                                fullSymbolName
                            });
                            
                            found = true;
                            break;
                        }
                    } catch (instError) {
                        logger.debug('Error looking up instrument', {
                            symbol,
                            exchangeSegment,
                            error: (instError as Error).message
                        });
                    }
                }

                if (!found) {
                    try {
                        const indexInstrument = await IndexInstrument.findOne({
                            name: { $regex: new RegExp(`^${symbol}$`, 'i') }
                        }).select('name exchangeInstrumentId').lean();

                        if (indexInstrument && (indexInstrument as any).exchangeInstrumentId) {
                            const fullSymbolName = (indexInstrument as any).name || symbol;
                            
                            this.symbolToInstrumentMap.set(symbol, {
                                exchangeSegment: 1,
                                exchangeInstrumentID: (indexInstrument as any).exchangeInstrumentId,
                                fullSymbolName: fullSymbolName
                            });
                            
                            this.instrumentToSymbolMap.set(
                                (indexInstrument as any).exchangeInstrumentId,
                                fullSymbolName
                            );
                            
                            const key = `1_${(indexInstrument as any).exchangeInstrumentId}`;
                            instrumentsMap.set(key, {
                                exchangeSegment: 1,
                                exchangeInstrumentID: (indexInstrument as any).exchangeInstrumentId
                            });
                            
                            logger.info('Found and mapped missing index symbol', {
                                symbol,
                                exchangeInstrumentID: (indexInstrument as any).exchangeInstrumentId,
                                fullSymbolName
                            });
                            
                            found = true;
                        }
                    } catch (indexError) {
                        logger.debug('Error looking up index instrument', {
                            symbol,
                            error: (indexError as Error).message
                        });
                    }
                }

                if (!found) {
                    logger.error('Could not find instrument mapping for symbol after database lookup', {
                        symbol,
                        searchedExchanges: exchangeSegments,
                        searchedIndexInstruments: true,
                        note: 'Symbol will not receive market data. Please verify symbol name is correct in database.'
                    });
                }
            }
        } catch (dbError) {
            logger.error('Error looking up missing symbols in database', {
                error: (dbError as Error).message,
                missingSymbols
            });
        }
    }

    /**
     * Handle quote updates from broker WebSocket and forward to clients
     */
    public async handleBrokerQuoteUpdate(quoteData: Record<string, unknown>): Promise<void> {
        try {
            // Extract quote data - handle different formats
            let data: any = quoteData.data || quoteData;
            
            if (typeof data === 'string') {
                try {
                    data = JSON.parse(data);
                } catch (e) {
                    logger.error('Failed to parse JSON string in broker quote update:', e);
                    return;
                }
            }
            
            if (typeof quoteData === 'string') {
                try {
                    data = JSON.parse(quoteData);
                } catch (e) {
                    logger.error('Failed to parse quoteData string:', e);
                    return;
                }
            }
            
            const exchangeInstrumentID = 
                data?.ExchangeInstrumentID || 
                data?.exchangeInstrumentID || 
                data?.InstrumentIdentifier?.ExchangeInstrumentID;

            if (!exchangeInstrumentID) {
                logger.debug('No exchangeInstrumentID in quote data', {
                    dataKeys: typeof data === 'object' && data !== null ? Object.keys(data).slice(0, 15) : 'N/A',
                });
                return;
            }

            const instrumentIdNum = Number(exchangeInstrumentID);
            // Reduce logging - only log for specific instruments or when mapping is missing
            if (instrumentIdNum === 6705 || !this.instrumentToSymbolMap.has(instrumentIdNum)) {
                logger.debug('Received quote update from broker', {
                    exchangeInstrumentID: instrumentIdNum,
                    instrumentToSymbolMapSize: this.instrumentToSymbolMap.size,
                    symbolToInstrumentMapSize: this.symbolToInstrumentMap.size,
                    hasMapping: this.instrumentToSymbolMap.has(instrumentIdNum)
                });
            }

            // Find full symbol name from instrument ID
            let fullSymbolName = this.instrumentToSymbolMap.get(Number(exchangeInstrumentID));
            
            // Reduce logging frequency - only log for specific instruments or errors
            if (instrumentIdNum === 6705 || !fullSymbolName) {
                logger.debug('Symbol lookup result', {
                    exchangeInstrumentID: Number(exchangeInstrumentID),
                    fullSymbolName,
                    foundInMap: !!fullSymbolName
                });
            }

            // Find short symbol from subscriptions
            let shortSymbol: string | null = null;
            for (const [shortSym, instrumentInfo] of this.symbolToInstrumentMap.entries()) {
                if (instrumentInfo.exchangeInstrumentID === Number(exchangeInstrumentID)) {
                    shortSymbol = shortSym ? shortSym.toUpperCase().trim() : null;
                    if (!fullSymbolName && shortSymbol) {
                        fullSymbolName = shortSymbol;
                    }
                    break;
                }
            }

            // Try to find short symbol by matching full symbol name
            if (!shortSymbol && fullSymbolName) {
                for (const [shortSym, instrumentInfo] of this.symbolToInstrumentMap.entries()) {
                    if (instrumentInfo.fullSymbolName && 
                        instrumentInfo.fullSymbolName.toUpperCase().trim() === fullSymbolName.toUpperCase().trim()) {
                        shortSymbol = shortSym ? shortSym.toUpperCase().trim() : null;
                        logger.debug('Found short symbol via full symbol name match', {
                            fullSymbolName,
                            shortSymbol,
                            exchangeInstrumentID,
                        });
                        break;
                    }
                }
            }

            // Use fullSymbolName as shortSymbol if still not found
            if (!shortSymbol && fullSymbolName) {
                shortSymbol = fullSymbolName.toUpperCase().trim();
                logger.debug('Using fullSymbolName as shortSymbol (index instrument fallback)', {
                    fullSymbolName,
                    shortSymbol,
                    exchangeInstrumentID,
                });
            }

            // Dynamic database lookup if mapping not found
            if (!shortSymbol) {
                await this.dynamicLookupInstrument(instrumentIdNum);
                // Retry lookup after dynamic mapping
                fullSymbolName = this.instrumentToSymbolMap.get(instrumentIdNum);
                for (const [shortSym, instrumentInfo] of this.symbolToInstrumentMap.entries()) {
                    if (instrumentInfo.exchangeInstrumentID === instrumentIdNum) {
                        shortSymbol = shortSym ? shortSym.toUpperCase().trim() : null;
                        if (!fullSymbolName && shortSymbol) {
                            fullSymbolName = shortSymbol;
                        }
                        break;
                    }
                }
                if (!shortSymbol && fullSymbolName) {
                    shortSymbol = fullSymbolName.toUpperCase().trim();
                }
                
                // CRITICAL FIX: After dynamic lookup, check if any subscription exists for this instrument ID
                // This is the KEY fix - we check subscriptions directly by instrument ID, not by symbol name
                // This handles cases where subscription symbol doesn't have mapping yet
                let foundSubscriptionSymbol: string | null = null;
                
                // First, try to find subscription by checking if subscription symbol has mapping
                for (const [subscribedSym] of this.marketDataSubscriptions.entries()) {
                    const subscribedInstrument = this.symbolToInstrumentMap.get(subscribedSym);
                    if (subscribedInstrument && subscribedInstrument.exchangeInstrumentID === instrumentIdNum) {
                        foundSubscriptionSymbol = subscribedSym;
                        break;
                    }
                }
                
                // If not found above, check if we can find subscription by looking up strategies
                // This handles the case where subscription exists but mapping wasn't created during subscription
                if (!foundSubscriptionSymbol) {
                    try {
                        const Strategy = (await import('../models/Strategy.model')).default;
                        // Find ALL strategies with this instrument ID (in case multiple users have same instrument)
                        const strategies = await Strategy.find({
                            exchangeInstrumentID: instrumentIdNum
                        }).select('symbol').lean();
                        
                        // Check each strategy symbol against subscriptions
                        for (const strategy of strategies) {
                            if (strategy && (strategy as any).symbol) {
                                const strategySymbol = ((strategy as any).symbol as string).toUpperCase().trim();
                                // Check if this symbol is in subscriptions
                                if (this.marketDataSubscriptions.has(strategySymbol)) {
                                    foundSubscriptionSymbol = strategySymbol;
                                    // Create mapping for this subscription symbol
                                    const dbMapping = this.symbolToInstrumentMap.get(shortSymbol || '');
                                    if (dbMapping) {
                                        this.symbolToInstrumentMap.set(strategySymbol, dbMapping);
                                    }
                                    break; // Found it, stop searching
                                }
                            }
                        }
                        
                        // If still not found, check ALL subscriptions to see if any have a strategy with this instrument ID
                        // This is the most reliable fallback - check each subscription symbol's strategy
                        if (!foundSubscriptionSymbol) {
                            for (const [subscribedSym] of this.marketDataSubscriptions.entries()) {
                                try {
                                    // Check if this subscription symbol has a strategy with this instrument ID
                                    const strategyForSubscription = await Strategy.findOne({
                                        symbol: { $regex: new RegExp(`^${subscribedSym}$`, 'i') },
                                        exchangeInstrumentID: instrumentIdNum
                                    }).select('symbol exchangeInstrumentID').lean();
                                    
                                    if (strategyForSubscription) {
                                        foundSubscriptionSymbol = subscribedSym;
                                        // Create mapping for this subscription symbol
                                        const dbMapping = this.symbolToInstrumentMap.get(shortSymbol || '');
                                        if (dbMapping) {
                                            this.symbolToInstrumentMap.set(subscribedSym, dbMapping);
                                        }
                                        break; // Found it, stop searching
                                    }
                                } catch (subError) {
                                    // Continue to next subscription if this one fails
                                    continue;
                                }
                            }
                        }
                        
                        // Last resort: try to match by symbol name similarity
                        if (!foundSubscriptionSymbol && shortSymbol) {
                            const normalizedDbSymbol = shortSymbol.toUpperCase().trim();
                            for (const [subscribedSym] of this.marketDataSubscriptions.entries()) {
                                const normalizedSubscribedSym = subscribedSym.toUpperCase().trim();
                                // Try exact match first
                                if (normalizedSubscribedSym === normalizedDbSymbol) {
                                    foundSubscriptionSymbol = subscribedSym;
                                    // Create mapping
                                    const dbMapping = this.symbolToInstrumentMap.get(shortSymbol || '');
                                    if (dbMapping) {
                                        this.symbolToInstrumentMap.set(subscribedSym, dbMapping);
                                    }
                                    break;
                                }
                            }
                        }
                    } catch (strategyError) {
                        // Silently continue if strategy lookup fails
                    }
                }
                
                // If found, use subscription symbol and ensure mapping exists
                if (foundSubscriptionSymbol) {
                    shortSymbol = foundSubscriptionSymbol;
                    // Ensure mapping exists for subscription symbol
                    if (!this.symbolToInstrumentMap.has(foundSubscriptionSymbol)) {
                        const dbMapping = this.symbolToInstrumentMap.get(shortSymbol || '');
                        if (dbMapping) {
                            this.symbolToInstrumentMap.set(foundSubscriptionSymbol, dbMapping);
                        }
                    }
                }
            }


            if (!shortSymbol) {
                // Log only once per instrument to avoid spam
                const logKey = `no_symbol_${instrumentIdNum}`;
                if (!this._loggedMissingSubscriptions || !this._loggedMissingSubscriptions.has(logKey)) {
                    if (!this._loggedMissingSubscriptions) {
                        this._loggedMissingSubscriptions = new Set();
                    }
                    this._loggedMissingSubscriptions.add(logKey);
                    logger.warn('No symbol mapping found for instrument - quote will not be forwarded', {
                        exchangeInstrumentID: instrumentIdNum
                    });
                }
                return;
            }

            // Check if there are any subscribers for this short symbol
            // Pass instrument ID first for priority matching
            let subscribedSymbol = await this.findSubscribedSymbol(shortSymbol, Number(exchangeInstrumentID));
            
            if (!subscribedSymbol) {
                // Log only once per instrument to avoid spam
                const logKey = `no_sub_${instrumentIdNum}`;
                if (!this._loggedMissingSubscriptions || !this._loggedMissingSubscriptions.has(logKey)) {
                    if (!this._loggedMissingSubscriptions) {
                        this._loggedMissingSubscriptions = new Set();
                    }
                    this._loggedMissingSubscriptions.add(logKey);
                    logger.warn('No subscription found for instrument - quote will not be forwarded', {
                        exchangeInstrumentID: instrumentIdNum,
                        shortSymbol
                    });
                }
                return;
            }

            // Extract price data based on event type
            let priceData = data as any;
            const messageCode = data?.MessageCode || data?.messageCode;
            
            if (messageCode === 1502 && data?.Touchline) {
                priceData = {
                    ...data,
                    ...data.Touchline,
                };
            }

            // Emit to all subscribers
            this.emitters.emitMarketData(subscribedSymbol, priceData as Record<string, unknown>);

        } catch (error: any) {
            logger.error('Error handling broker quote update:', error);
        }
    }

    /**
     * Dynamic lookup instrument in database
     */
    private async dynamicLookupInstrument(instrumentIdNum: number): Promise<void> {
        
        try {
            const XtsInstrument = (await import('../models/XtsInstrument.model')).default;
            const IndexInstrument = (await import('../models/IndexInstrument.model')).default;
            
            const instrument = await XtsInstrument.findOne({
                exchangeInstrumentID: instrumentIdNum
            }).select('name exchangeSegment exchangeInstrumentID').lean();
            
            if (instrument && (instrument as any).exchangeInstrumentID) {
                const mappedFullSymbolName = (instrument as any).name || `INSTRUMENT_${instrumentIdNum}`;
                const exchangeSegment = (instrument as any).exchangeSegment || 1;
                const symbolKey = mappedFullSymbolName.toUpperCase().trim();
                
                this.symbolToInstrumentMap.set(symbolKey, {
                    exchangeSegment: exchangeSegment,
                    exchangeInstrumentID: instrumentIdNum,
                    fullSymbolName: mappedFullSymbolName
                });
                
                this.instrumentToSymbolMap.set(instrumentIdNum, mappedFullSymbolName);
            } else {
                const indexInstrument = await IndexInstrument.findOne({
                    exchangeInstrumentId: instrumentIdNum
                }).select('name exchangeInstrumentId').lean();
                
                if (indexInstrument && (indexInstrument as any).exchangeInstrumentId) {
                    const mappedFullSymbolName = (indexInstrument as any).name || `INDEX_${instrumentIdNum}`;
                    const symbolKey = mappedFullSymbolName.toUpperCase().trim();
                    
                    this.symbolToInstrumentMap.set(symbolKey, {
                        exchangeSegment: 1,
                        exchangeInstrumentID: instrumentIdNum,
                        fullSymbolName: mappedFullSymbolName
                    });
                    
                    this.instrumentToSymbolMap.set(instrumentIdNum, mappedFullSymbolName);
                }
            }
        } catch (dbError) {
            logger.error('Error looking up instrument in database for quote', {
                exchangeInstrumentID: instrumentIdNum,
                error: (dbError as Error).message
            });
        }
    }

    /**
     * Find subscribed symbol for quote forwarding
     * Priority: 1. Instrument ID match (most reliable), 2. Exact match, 3. Case-insensitive match
     */
    private async findSubscribedSymbol(shortSymbol: string | null, exchangeInstrumentID: number): Promise<string | null> {
        // FIRST: Try to find by instrument ID directly (most reliable)
        // This handles cases where symbol name doesn't match but instrument ID does
        for (const [subscribedSym] of this.marketDataSubscriptions.entries()) {
            const subscribedInstrument = this.symbolToInstrumentMap.get(subscribedSym);
            if (subscribedInstrument && subscribedInstrument.exchangeInstrumentID === exchangeInstrumentID) {
                return subscribedSym;
            }
        }

        // FALLBACK: If instrument ID match failed (subscription symbol doesn't have mapping),
        // try to find subscription by looking up strategy in database
        // This handles cases where subscription was done but mapping wasn't created
        try {
            const Strategy = (await import('../models/Strategy.model')).default;
            const strategy = await Strategy.findOne({
                exchangeInstrumentID: exchangeInstrumentID
            }).select('symbol').lean();
            
            if (strategy && (strategy as any).symbol) {
                const strategySymbol = ((strategy as any).symbol as string).toUpperCase().trim();
                // Check if this symbol is in subscriptions
                if (this.marketDataSubscriptions.has(strategySymbol)) {
                    return strategySymbol;
                }
            }
        } catch (strategyError) {
            // Silently continue if strategy lookup fails
        }

        // If no instrument ID match and no shortSymbol, return null
        if (!shortSymbol) {
            logger.warn('No shortSymbol and no instrument ID match found', {
                exchangeInstrumentID,
                totalSubscriptions: this.marketDataSubscriptions.size,
                availableSubscriptions: Array.from(this.marketDataSubscriptions.keys())
            });
            return null;
        }

        // SECOND: Try exact match
        if (this.marketDataSubscriptions.has(shortSymbol)) {
            return shortSymbol;
        }

        // THIRD: Try case-insensitive lookup
        for (const [subscribedSym] of this.marketDataSubscriptions.entries()) {
            if (subscribedSym.toUpperCase().trim() === shortSymbol.toUpperCase().trim()) {
                return subscribedSym;
            }
        }

        // FINAL: No match found
        return null;
    }
}

