// Broker integration types
export interface BrokerCredentials {
    broker: string;
    clientId: string;
    password?: string;
    apiKey?: string;
    apiSecret?: string;
    marketDataApiKey?: string;
    marketDataSecret?: string;
    connectedAt?: Date;
    isConnected: boolean;
    token?: string;
    tokenGeneratedAt?: Date;
}

export interface OrderRequest {
    exchangeSegment: number;
    exchangeInstrumentID: number;
    productType: string;
    orderType: string;
    buyOrSell: 'BUY' | 'SELL';
    quantity: number;
    disclosedQuantity: number;
    price: number;
    triggerPrice: number;
    stopPrice: number;
    validity: string;
    validityDate: string;
    orderUniqueIdentifier: string;
    clientID: string;
}

export interface OrderResponse {
    result: {
        AppOrderID: number;
        OrderID: string;
        Status: string;
    };
}

export interface Position {
    exchangeInstrumentID: number;
    symbol: string;
    quantity: number;
    averagePrice: number;
    lastTradedPrice: number;
    pnl: number;
    dayChange: number;
}

export interface Holding {
    exchangeInstrumentID: number;
    symbol: string;
    quantity: number;
    averagePrice: number;
    lastTradedPrice: number;
    dayChange: number;
}
