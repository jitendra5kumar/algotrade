
import { IStrategy } from '../models/Strategy.model';

// Type for indicator configuration map
type IndicatorConfigMap = Map<string, { parameters: Record<string, unknown> }> | Record<string, { parameters: Record<string, unknown> }>;

class StrategyService {


    public async updateStrategyIndicators(strategy: IStrategy, configMap: IndicatorConfigMap) {

        let configObj: Record<string, { parameters: Record<string, unknown> }> = {};
				if (configMap instanceof Map) {
					for (const [key, config] of configMap.entries()) {
						configObj[key] = config;
					}
				} else {
					configObj = configMap;
				}

        const finalIndicatorConfig: Record<string, Record<string, unknown>> = {};
        for (const [key, config] of Object.entries(configObj)) {
			finalIndicatorConfig[key] = { ...config.parameters };
        }
        strategy.config.indicators = finalIndicatorConfig;
        await strategy.save();
        console.log("Updating indicators for strategy:", strategy._id);
        console.log('indicators config:',finalIndicatorConfig)
    }
}

export default new StrategyService();


