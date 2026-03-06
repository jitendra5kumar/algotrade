export interface User {
	id?: string;
	_id?: string;
	name: string;
	email: string;
	phone: string;
	accountType: string;
	joinDate: string;
	totalStrategies: number;
	totalTrades: number;
	status: "active" | "inactive";
}

