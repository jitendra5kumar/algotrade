import 'dotenv/config';
import mongoose from 'mongoose';
import marketDataService from '../services/market-data.service';
import logger from '../utils/logger';

/**
 * Testing script to check live price for Nifty 50 (instrument ID: 26000)
 * Run with: npx ts-node backend/src/scripts/test-nifty-price.ts
 */

async function testNiftyPrice() {
	try {
		// Connect to MongoDB
		const mongoUri = process.env.MONGODB_URI || 'mongodb+srv://algotrading:ub2nYfjztv0EvIl5@algotrading.47ycniz.mongodb.net/';
		await mongoose.connect(mongoUri);
		logger.info('✅ Connected to MongoDB');

		// Nifty 50 instrument details
		// Note: Nifty 50 is an index, in NSECM segment (1) with series "INDEX"
		const instrumentId = 26000;
		const exchangeSegment = 1; // NSECM for indices

		console.log('\n🔍 Testing Live Price for Nifty 50');
		console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
		console.log(`Instrument ID: ${instrumentId}`);
		console.log(`Exchange Segment: ${exchangeSegment} (NSECM)`);
		console.log(`Series: INDEX`);
		console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

		// Try to get live quotes
		console.log('📡 Fetching live quotes...\n');
		const quotes = await marketDataService.getLiveQuotes([
			{
				exchangeSegment: exchangeSegment,
				exchangeInstrumentID: instrumentId,
			},
		]);

		if (quotes && quotes.length > 0) {
			const quote = quotes[0] as any;
			
			// Extract price from different possible fields
			const touchline = quote.Touchline || quote.touchline;
			const lastPrice =
				touchline?.LastTradedPrice ||
				touchline?.lastTradedPrice ||
				quote.LastTradedPrice ||
				quote.lastTradedPrice ||
				quote.LTP ||
				quote.lastPrice;

			const change =
				touchline?.Change ||
				touchline?.change ||
				quote.Change ||
				quote.change ||
				quote.ChangeValue ||
				quote.changeValue ||
				0;

			const changePercent =
				touchline?.PercentChange ||
				touchline?.percentChange ||
				quote.PercentChange ||
				quote.changePercent ||
				quote.ChangePercent ||
				quote.changePercentage ||
				(lastPrice && change ? (change / (lastPrice - change)) * 100 : 0);

			const volume =
				touchline?.TotalTradedQuantity ||
				touchline?.Volume ||
				quote.TotalTradedQuantity ||
				quote.Volume ||
				quote.volume ||
				quote.TotalVolume ||
				0;

			console.log('✅ Live Price Data Received:');
			console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
			console.log(`📊 Last Traded Price (LTP): ₹${lastPrice?.toFixed(2) || 'N/A'}`);
			console.log(`📈 Change: ${change >= 0 ? '+' : ''}₹${change?.toFixed(2) || '0.00'}`);
			console.log(`📊 Change %: ${changePercent >= 0 ? '+' : ''}${changePercent?.toFixed(2) || '0.00'}%`);
			console.log(`📦 Volume: ${volume?.toLocaleString('en-IN') || '0'}`);
			console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

			// Log full quote object for debugging
			console.log('📋 Full Quote Object:');
			console.log(JSON.stringify(quote, null, 2));
			console.log('\n');

		} else {
			console.log('❌ No quotes received');
			console.log('Trying with NSEFO segment (2) as fallback...\n');
			
			// Try with NSEFO segment as fallback
			const quotesFallback = await marketDataService.getLiveQuotes([
				{
					exchangeSegment: 2, // NSEFO
					exchangeInstrumentID: instrumentId,
				},
			]);

			if (quotesFallback && quotesFallback.length > 0) {
				const quote = quotesFallback[0] as any;
				const touchline = quote.Touchline || quote.touchline;
				const lastPrice =
					touchline?.LastTradedPrice ||
					touchline?.lastTradedPrice ||
					quote.LastTradedPrice ||
					quote.lastTradedPrice ||
					quote.LTP ||
					quote.lastPrice;

				console.log('✅ Live Price (NSEFO segment fallback):');
				console.log(`📊 Last Traded Price: ₹${lastPrice?.toFixed(2) || 'N/A'}\n`);
			} else {
				console.log('❌ No quotes received from either segment');
				console.log('Possible reasons:');
				console.log('  - Market is closed');
				console.log('  - Instrument not subscribed');
				console.log('  - Token authentication issue');
				console.log('  - Wrong exchange segment');
				console.log('  - Note: Nifty 50 should be in NSECM (1) with series INDEX\n');
			}
		}

		// Test multiple times to see if data is updating
		console.log('🔄 Testing continuous updates (5 attempts, 3 seconds apart)...\n');
		for (let i = 1; i <= 5; i++) {
			const quotes = await marketDataService.getLiveQuotes([
				{
					exchangeSegment: exchangeSegment,
					exchangeInstrumentID: instrumentId,
				},
			]);

			if (quotes && quotes.length > 0) {
				const quote = quotes[0] as any;
				const touchline = quote.Touchline || quote.touchline;
				const lastPrice =
					touchline?.LastTradedPrice ||
					touchline?.lastTradedPrice ||
					quote.LastTradedPrice ||
					quote.lastTradedPrice ||
					quote.LTP ||
					quote.lastPrice;

				const timestamp = new Date().toLocaleTimeString('en-IN', {
					hour: '2-digit',
					minute: '2-digit',
					second: '2-digit',
				});

				console.log(`[${timestamp}] Attempt ${i}: LTP = ₹${lastPrice?.toFixed(2) || 'N/A'}`);
			} else {
				console.log(`[${new Date().toLocaleTimeString()}] Attempt ${i}: No data`);
			}

			if (i < 5) {
				await new Promise(resolve => setTimeout(resolve, 3000)); // Wait 3 seconds
			}
		}

		console.log('\n✅ Test completed\n');

	} catch (error: any) {
		console.error('\n❌ Error testing Nifty price:');
		console.error(error.message || error);
		if (error.stack) {
			console.error('\nStack trace:');
			console.error(error.stack);
		}
	} finally {
		// Close MongoDB connection
		await mongoose.disconnect();
		logger.info('Disconnected from MongoDB');
		process.exit(0);
	}
}

// Run the test
testNiftyPrice();

