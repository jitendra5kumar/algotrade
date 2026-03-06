export interface StrategyTemplate {
	_id: string;
	name: string;
	description: string;
	type: string;
	tags: string;
	isVisibleToUsers: boolean;
	indicators: {
		enabled: string[];
		configurations: Record<string, any>;
	};
	usageCount?: number;
}

export interface FormData {
	name: string;
	description: string;
	type: string;
	tags: string;
	isVisibleToUsers: boolean;
	indicators: {
		enabled: string[];
		configurations: Record<string, any>;
	};
}

