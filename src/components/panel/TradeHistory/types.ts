export interface Trade {
	id: string;
	symbol: string;
	strategy: string;
	type: "BUY" | "SELL";
	entry: string;
	exit: string;
	qty: number;
	pnl: string;
	pnlPercent: string;
	date: string;
	time: string;
	entryDate: string;
	entryTime: string;
	exitDate: string | null;
	exitTime: string | null;
	status: string;
}

export interface TradeStats {
	totalPnL: number;
	totalTrades: number;
	winRate: number;
}

