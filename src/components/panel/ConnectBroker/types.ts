export interface BrokerDetails {
	clientId: string;
	apiKey: string;
	apiSecret: string;
	marketDataApiKey: string;
	marketDataSecret: string;
}

export interface SavedBrokerCredentials {
	isConnected: boolean;
	broker?: string;
	clientId?: string;
	connectedAt?: Date;
	balance?: unknown;
	message?: string;
}

export interface ConnectBrokerDrawerProps {
	isOpen: boolean;
	onClose: () => void;
	selectedBroker: string;
	handleBrokerChange?: (broker: string) => void;
	setSelectedBroker?: (broker: string) => void;
	brokerDetails: BrokerDetails;
	handleInputChange: (field: string, value: string) => void;
	handleConnect?: () => void;
	savedBrokerCredentials?: SavedBrokerCredentials | null;
}

