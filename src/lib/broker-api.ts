import api from "./api";

class BrokerApiService {
	private async unwrap<T>(promise: Promise<any>): Promise<T> {
		const response = await promise;
		return (response?.data ?? response) as T;
	}

	async getStatus(): Promise<any> {
		return this.unwrap(api.get("/api/broker/status"));
	}

	async getOrderBook(): Promise<any> {
		return this.unwrap(api.get("/api/broker/orderbook"));
	}

	async getPositions(): Promise<any> {
		return this.unwrap(api.get("/api/broker/positions"));
	}

	async getHoldings(): Promise<any> {
		return this.unwrap(api.get("/api/broker/holdings"));
	}

	async getTradebook(): Promise<any> {
		return this.unwrap(api.get("/api/broker/tradebook"));
	}
}

export default new BrokerApiService();