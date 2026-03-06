import mongoose from 'mongoose';
import StrategyTemplate, { IStrategyTemplate } from '../models/StrategyTemplate.model';
import User from '../models/User.model';
import logger from '../utils/logger';

// Sample strategy templates
const templates = [
    {
        name: 'EMA Crossover Strategy',
        description: 'A momentum strategy using two EMA crossovers to identify trend changes',
        type: 'NORMAL',
        isActive: true,
        isVisibleToUsers: true,
        indicators: {
            enabled: ['ema'],
            configurations: {
                ema: {
                    parameters: {
                        fast: 12,
                        slow: 26
                    },
                    isVisible: true,
                    isEditable: true
                }
            }
        }
    },
    {
        name: 'RSI Momentum Strategy',
        description: 'Uses RSI to identify overbought and oversold conditions',
        type: 'SCALPING',
        isActive: true,
        isVisibleToUsers: true,
        indicators: {
            enabled: ['rsi'],
            configurations: {
                rsi: {
                    parameters: {
                        period: 14,
                        overbought: 70,
                        oversold: 30
                    },
                    isVisible: true,
                    isEditable: true
                }
            }
        }
    },
    {
        name: 'MACD Trend Strategy',
        description: 'Uses MACD to identify trend and momentum changes',
        type: 'NORMAL',
        isActive: true,
        isVisibleToUsers: true,
        indicators: {
            enabled: ['macd', 'ema'],
            configurations: {
                macd: {
                    parameters: {
                        fast: 12,
                        slow: 26,
                        signal: 9
                    },
                    isVisible: true,
                    isEditable: true
                },
                ema: {
                    parameters: {
                        fast: 9,
                        slow: 21
                    },
                    isVisible: true,
                    isEditable: false
                }
            }
        }
    },
    {
        name: 'Bollinger Bands Breakout',
        description: 'Trades on price breakouts from Bollinger Bands',
        type: 'NORMAL',
        isActive: true,
        isVisibleToUsers: true,
        indicators: {
            enabled: ['bollingerBands', 'rsi'],
            configurations: {
                bollingerBands: {
                    parameters: {
                        period: 20,
                        stdDev: 2
                    },
                    isVisible: true,
                    isEditable: true
                },
                rsi: {
                    parameters: {
                        period: 14,
                        overbought: 70,
                        oversold: 30
                    },
                    isVisible: true,
                    isEditable: true
                }
            }
        }
    },
    {
        name: 'SuperTrend Trend Following',
        description: 'Uses SuperTrend indicator for trend following strategy',
        type: 'NORMAL',
        isActive: true,
        isVisibleToUsers: true,
        indicators: {
            enabled: ['supertrend'],
            configurations: {
                supertrend: {
                    parameters: {
                        period: 10,
                        multiplier: 3.0
                    },
                    isVisible: true,
                    isEditable: true
                }
            }
        }
    },
    {
        name: 'Multi-Indicator Strategy',
        description: 'Combines multiple indicators for entry confirmation',
        type: 'NORMAL',
        isActive: true,
        isVisibleToUsers: true,
        indicators: {
            enabled: ['ema', 'rsi', 'macd', 'atr'],
            configurations: {
                ema: {
                    parameters: {
                        fast: 9,
                        slow: 21
                    },
                    isVisible: true,
                    isEditable: true
                },
                rsi: {
                    parameters: {
                        period: 14,
                        overbought: 75,
                        oversold: 25
                    },
                    isVisible: true,
                    isEditable: true
                },
                macd: {
                    parameters: {
                        fast: 12,
                        slow: 26,
                        signal: 9
                    },
                    isVisible: true,
                    isEditable: false
                },
                atr: {
                    parameters: {
                        period: 14
                    },
                    isVisible: true,
                    isEditable: false
                }
            }
        }
    },
    {
        name: 'Stochastic Oscillator Strategy',
        description: 'Uses Stochastic to identify momentum and overbought/oversold conditions',
        type: 'SCALPING',
        isActive: true,
        isVisibleToUsers: true,
        indicators: {
            enabled: ['stochastic', 'rsi'],
            configurations: {
                stochastic: {
                    parameters: {
                        period: 14,
                        signalPeriod: 3
                    },
                    isVisible: true,
                    isEditable: true
                },
                rsi: {
                    parameters: {
                        period: 14,
                        overbought: 70,
                        oversold: 30
                    },
                    isVisible: true,
                    isEditable: false
                }
            }
        }
    },
    {
        name: 'ADX Trend Strength Strategy',
        description: 'Uses ADX to measure trend strength combined with price action',
        type: 'NORMAL',
        isActive: true,
        isVisibleToUsers: true,
        indicators: {
            enabled: ['adx', 'ema'],
            configurations: {
                adx: {
                    parameters: {
                        period: 14
                    },
                    isVisible: true,
                    isEditable: true
                },
                ema: {
                    parameters: {
                        fast: 9,
                        slow: 21
                    },
                    isVisible: true,
                    isEditable: false
                }
            }
        }
    },
    {
        name: 'Opening Range Breakout (ORB)',
        description: 'Trades breakouts from the opening range using ORB indicator',
        type: 'SCALPING',
        isActive: true,
        isVisibleToUsers: true,
        indicators: {
            enabled: ['orb', 'atr'],
            configurations: {
                orb: {
                    parameters: {
                        openingRangeMinutes: 30,
                        breakoutThreshold: 0.5
                    },
                    isVisible: true,
                    isEditable: true
                },
                atr: {
                    parameters: {
                        period: 14
                    },
                    isVisible: true,
                    isEditable: false
                }
            }
        }
    },
    {
        name: 'HalfTrend Trend Reversal',
        description: 'Uses HalfTrend indicator to identify trend reversals',
        type: 'NORMAL',
        isActive: true,
        isVisibleToUsers: true,
        indicators: {
            enabled: ['halftrend', 'rsi'],
            configurations: {
                halftrend: {
                    parameters: {
                        amplitude: 12,
                        channelDeviation: 5
                    },
                    isVisible: true,
                    isEditable: true
                },
                rsi: {
                    parameters: {
                        period: 14,
                        overbought: 70,
                        oversold: 30
                    },
                    isVisible: true,
                    isEditable: false
                }
            }
        }
    }
];

async function seedTemplates() {
    try {
        // Connect to MongoDB
        const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/algotrade';
        await mongoose.connect(mongoUri);
        logger.info('Connected to MongoDB');

        // Get admin user (first admin found)
        const adminUser = await User.findOne({ role: 'ADMIN' });
        
        if (!adminUser) {
            logger.error('No admin user found. Please create an admin user first.');
            process.exit(1);
        }

        logger.info(`Using admin: ${adminUser.email}`);

        // Clear existing templates (optional - comment out to keep existing)
        // await StrategyTemplate.deleteMany({});

        // Create templates
        const createdTemplates: IStrategyTemplate[] = [];
        
        for (const template of templates) {
            const existing = await StrategyTemplate.findOne({ name: template.name });
            
            if (existing) {
                logger.info(`Template "${template.name}" already exists, skipping...`);
                continue;
            }

            const newTemplate = await StrategyTemplate.create({
                ...template,
                createdBy: adminUser._id,
                usageCount: 0
            });

            createdTemplates.push(newTemplate);
            logger.info(`Created template: ${newTemplate.name}`);
        }

        logger.info(`\n✅ Successfully created ${createdTemplates.length} strategy templates`);
        logger.info('\nTemplates created:');
        createdTemplates.forEach(t => {
            logger.info(`  - ${t.name} (${t.indicators.enabled.join(', ')})`);
        });

        process.exit(0);
    } catch (error) {
        logger.error('Error seeding templates:', error);
        process.exit(1);
    }
}

// Run if called directly
if (require.main === module) {
    seedTemplates();
}

export default seedTemplates;
