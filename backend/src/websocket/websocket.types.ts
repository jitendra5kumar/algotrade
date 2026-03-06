import io from 'socket.io';

export interface AuthenticatedSocket extends io.Socket {
    userId?: string;
    email?: string;
}

export interface InstrumentMapping {
    exchangeSegment: number;
    exchangeInstrumentID: number;
    fullSymbolName?: string;
}

