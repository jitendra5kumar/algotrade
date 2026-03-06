export interface Strategy {
	id?: string;
	_id?: string;
	name: string;
	user: string;
	userEmail?: string;
	symbol: string;
	type: string;
	timeframe?: string;
	pnl: number;
	totalTrades: number;
	winRate: number;
	lastSignal: string;
	status: "active" | "paused" | "inactive";
	isActive?: boolean;
}

