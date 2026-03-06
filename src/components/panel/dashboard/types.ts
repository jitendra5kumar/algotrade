export interface MenuItem {
	id: string;
	label: string;
	icon: any;
}

export interface BrokerDetails {
	clientId: string;
	apiKey: string;
	apiSecret: string;
	marketDataApiKey: string;
	marketDataSecret: string;
}

export interface ContactForm {
	name: string;
	email: string;
	message: string;
}

export interface StrategyCardData {
	name: string;
	description: string;
	winRate: number;
	todayPnL: string;
	trades: number;
	capitalDeployed: string;
	avgTradeDuration: string;
	riskLevel: string;
	riskLevelColor: string;
	icon: any;
	gradientFrom: string;
	gradientTo: string;
	borderColor: string;
	badgeColor: string;
	textColor: string;
}

