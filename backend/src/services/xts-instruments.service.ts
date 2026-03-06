import axios from "axios";
import XtsInstrument from "../models/XtsInstrument.model";
import IndexInstrument from "../models/IndexInstrument.model";
import logger from "../utils/logger";

interface XtsInstrumentData {
	exchangeSegment: number;
	exchangeInstrumentID: number;
	instrumentType: number;
	name: string;
	description: string;
	series: string;
	nameWithSeries?: string;
	instrumentToken: number;
	priceBandHigh?: number;
	priceBandLow?: number;
	freezeQty?: number;
	tickSize: number;
	lotSize: number;
	multiplier?: number;
	displayName?: string;
	isin?: string;
	priceNumerator?: number;
	priceDenominator?: number;
	detailedDescription?: string;
	strikePrice?: number;
	optionType?: number | string;
	expiry?: string;
	contractExpiration?: string;
	underlyingInstrumentId?: number;
	underlyingIndexName?: string;
	unknownFieldOne?: number;
	unknownFieldTwo?: number;
	unknownFieldThree?: number;
}


class XtsInstrumentsService {
	private readonly API_URL = "https://algozy.rathi.com/apimarketdata/instruments/master";
	
	private readonly EXCHANGE_SEGMENTS = ["NSEFO", "NSECM", "BSECM", "BSEFO", "MCXFO"];

	/**
	 * Parse pipe-delimited data from API and convert to instrument objects
	 * Format for Equities: ExchangeSegment|ExchangeInstrumentID|InstrumentType|Name|Description|Series|NameWithSeries|InstrumentID|PriceBand.High|PriceBand.Low|FreezeQty|TickSize|LotSize|Multiplier|DisplayName|ISIN|PriceNumerator|PriceDenominator|DetailedDescription|ExtendedSurvIndicator|CautionIndicator|GSMIndicator
	 * Format for Futures/Options: ExchangeSegment|ExchangeInstrumentID|InstrumentType|Name|Description|Series|NameWithSeries|InstrumentID|PriceBand.High|PriceBand.Low|FreezeQty|TickSize|LotSize|Multiplier|UnderlyingInstrumentId|UnderlyingIndexName|ContractExpiration|StrikePrice|OptionType|DisplayName|PriceNumerator|PriceDenominator|DetailedDescription
	 */
	private parsePipeDelimitedData(data: string): XtsInstrumentData[] {
		const lines = data.trim().split("\n");
		const instruments: XtsInstrumentData[] = [];

		for (let i = 0; i < lines.length; i++) {
			const line = lines[i].trim();
			if (!line) continue;

			try {
				const values = line.split("|");
				
				// Minimum required columns
				if (values.length < 8) {
					logger.warn(`Skipping malformed line ${i + 1}: ${line}`);
					continue;
				}

				const segmentLabel = this.cleanString(values[0]) || "";
				const instrumentType = this.parseNumber(values[2]) ?? 0;
				
				// Determine if it's a derivative (Futures/Options) based on instrument type
				// InstrumentType: 1=Futures, 2=Options, 8=Equities
				const isDerivative = instrumentType === 1 || instrumentType === 2;

				const instrument: XtsInstrumentData = {
					exchangeSegment: this.getExchangeSegmentFromString(segmentLabel) || 0,
					exchangeInstrumentID: this.parseNumber(values[1]) ?? 0,
					instrumentType: instrumentType,
					name: this.cleanString(values[3]) || "",
					description: this.cleanString(values[4]) || "",
					series: this.cleanString(values[5]) || "",
					nameWithSeries: this.cleanString(values[6]),
					instrumentToken: this.parseNumber(values[7]) ?? 0,
					priceBandHigh: this.parseNumber(values[8]),
					priceBandLow: this.parseNumber(values[9]),
					freezeQty: this.parseNumber(values[10]),
					tickSize: this.parseNumber(values[11]) ?? 0.05,
					lotSize: this.parseNumber(values[12]) ?? 1,
					multiplier: this.parseNumber(values[13]),
				};

				if (isDerivative) {
					// Futures/Options format
					if (values.length > 14) {
						instrument.underlyingInstrumentId = this.parseNumber(values[14]);
					}
					if (values.length > 15) {
						instrument.underlyingIndexName = this.cleanString(values[15]) || "";
					}
					if (values.length > 16) {
						instrument.contractExpiration = this.cleanString(values[16]);
					}
					if (values.length > 17) {
						instrument.strikePrice = this.parseNumber(values[17]);
					}
					if (values.length > 18) {
						const optionTypeValue = this.parseNumber(values[18]);
						instrument.optionType =
							optionTypeValue !== undefined && !Number.isNaN(optionTypeValue)
								? optionTypeValue
								: this.cleanString(values[18]);
					}
					if (values.length > 19) {
						instrument.displayName = this.cleanString(values[19]);
					}
					if (values.length > 20) {
						instrument.priceNumerator = this.parseNumber(values[20]);
					}
					if (values.length > 21) {
						instrument.priceDenominator = this.parseNumber(values[21]);
					}
					if (values.length > 22) {
						instrument.detailedDescription = this.cleanString(values[22]);
					}
				} else {
					// Equities format
					if (values.length > 14) {
						instrument.displayName = this.cleanString(values[14]);
					}
					if (values.length > 15) {
						instrument.isin = this.cleanString(values[15]) ?? "";
					}
					if (values.length > 16) {
						instrument.priceNumerator = this.parseNumber(values[16]);
					}
					if (values.length > 17) {
						instrument.priceDenominator = this.parseNumber(values[17]);
					}
					if (values.length > 18) {
						instrument.detailedDescription = this.cleanString(values[18]);
					}
				}

				if (!instrument.expiry && instrument.contractExpiration) {
					instrument.expiry = instrument.contractExpiration;
				}

				// Validate required fields
				if (instrument.exchangeInstrumentID && instrument.instrumentToken && instrument.name) {
					instruments.push(instrument);
				} else {
					logger.warn(`Skipping invalid instrument data: ${JSON.stringify(instrument)}`);
				}
			} catch (error) {
				logger.error(`Error parsing line ${i + 1}: ${error}`);
			}
		}

		return instruments;
	}


	private cleanString(value?: string): string | undefined {
		if (value === undefined || value === null) {
			return undefined;
		}
		const trimmed = value.replace(/"/g, "").trim();
		return trimmed === "" ? undefined : trimmed;
	}

	private parseNumber(value?: string): number | undefined {
		const cleaned = this.cleanString(value);
		if (cleaned === undefined) {
			return undefined;
		}
		const num = Number(cleaned);
		if (Number.isNaN(num)) {
			return undefined;
		}
		return num;
	}

	/**
	 * Fetch instruments data from Algozy API
	 */
	private async fetchInstrumentsFromAPI(exchangeSegments: string[]): Promise<string> {
		try {
			logger.info(`Fetching instruments data from: ${this.API_URL}`);
			logger.info(`Requested exchange segments: ${exchangeSegments.join(", ")}`);

			const response = await axios.post(
				this.API_URL,
				{
					exchangeSegmentList: exchangeSegments,
				},
				{
					timeout: 60000, // 60 seconds timeout
					headers: {
						"Content-Type": "application/json",
						"User-Agent": "AlgoTrade-Backend/1.0",
					},
				}
			);

			if (response.status !== 200) {
				throw new Error(`HTTP ${response.status}: ${response.statusText}`);
			}

			// Check response type
			if (response.data.type === "error") {
				const errorDetails = response.data.result?.errors || [];
				const errorMessages = errorDetails.map((err: { messages?: string[] }) => 
					err.messages?.join(", ") || "Unknown error"
				).join("; ");
				throw new Error(`API Error (${response.data.code}): ${response.data.description}. ${errorMessages}`);
			}

			if (response.data.type === "success" && response.data.result) {
				// Result is a pipe-delimited string, split by newlines if multiple instruments
				return typeof response.data.result === "string" 
					? response.data.result 
					: String(response.data.result);
			}

			throw new Error("Unexpected response format from API");
		} catch (error) {
			if (axios.isAxiosError(error)) {
				logger.error(`Error fetching instruments from API: ${error.message}`);
				if (error.response) {
					logger.error(`Response status: ${error.response.status}`);
					logger.error(`Response data: ${JSON.stringify(error.response.data)}`);
				}
			} else {
				logger.error(`Error fetching instruments from API:`, error);
			}
			throw error;
		}
	}

	/**
	 * Extract index instruments from parsed instrument data
	 * Index instruments are typically identified by InstrumentType (e.g., 9 for indices)
	 * or by checking if the name matches common index patterns
	 */
	private extractIndexInstruments(instruments: XtsInstrumentData[]): Array<{ name: string; exchangeInstrumentId: number }> {
		const indexInstruments: Array<{ name: string; exchangeInstrumentId: number }> = [];
		
		// InstrumentType 9 is typically used for indices in XTS
		// Also check for common index patterns in names
		const indexPatterns = /^(NIFTY|BANKNIFTY|FINNIFTY|MIDCPNIFTY|SENSEX|BSE|NSE).*$/i;
		
		for (const instrument of instruments) {
			// Check if it's an index instrument
			// InstrumentType 9 = Index, or check name patterns
			if (instrument.instrumentType === 9 || indexPatterns.test(instrument.name)) {
				indexInstruments.push({
					name: instrument.name,
					exchangeInstrumentId: instrument.exchangeInstrumentID,
				});
			}
		}
		
		return indexInstruments;
	}

	/**
	 * Update index instruments from API
	 * @param preParsedInstruments - Optional pre-parsed instruments to avoid redundant API calls
	 */
	async updateIndexInstruments(preParsedInstruments?: XtsInstrumentData[]): Promise<{
		success: boolean;
		message: string;
		inserted: number;
		errors: number;
	}> {
		try {
			logger.info("Starting update of index instruments from API");
			
			let allInstruments: XtsInstrumentData[];
			
			// Use pre-parsed instruments if provided, otherwise fetch from API
			if (preParsedInstruments && preParsedInstruments.length > 0) {
				logger.info(`Using pre-parsed instruments (${preParsedInstruments.length} instruments)`);
				allInstruments = preParsedInstruments;
			} else {
				logger.info("Fetching instruments from API for index extraction");
				const apiData = await this.fetchInstrumentsFromAPI(this.EXCHANGE_SEGMENTS);
				allInstruments = this.parsePipeDelimitedData(apiData);
				logger.info(`Parsed ${allInstruments.length} total instruments from API`);
			}
			
			// Extract index instruments from the parsed data
			const indexInstruments = this.extractIndexInstruments(allInstruments);
			
			logger.info(`Extracted ${indexInstruments.length} index instruments`);

			if (indexInstruments.length === 0) {
				logger.warn("No index instruments found in API response.");
				return {
					success: false,
					message: "No index instruments found in API data",
					inserted: 0,
					errors: 0,
				};
			}

			// Log first few parsed instruments for debugging
			logger.info(`Sample index instruments: ${JSON.stringify(indexInstruments.slice(0, 3))}`);

			let inserted = 0;
			let errors = 0;

			// Clear existing data
			const deleteResult = await IndexInstrument.deleteMany({});
			logger.info(`Deleted ${deleteResult.deletedCount} existing index instruments`);

			// Insert new data in batches
			const batchSize = 1000;
			for (let i = 0; i < indexInstruments.length; i += batchSize) {
				const batch = indexInstruments.slice(i, i + batchSize);
				try {
					const insertResult = await IndexInstrument.insertMany(batch, { ordered: false });
					inserted += insertResult.length;
					logger.info(`Inserted index batch ${Math.floor(i / batchSize) + 1} of ${Math.ceil(indexInstruments.length / batchSize)} (${insertResult.length} documents)`);
				} catch (error: unknown) {
					const errorObj = error as { 
						code?: number; 
						writeErrors?: Array<{ errmsg?: string; code?: number }>;
						insertedDocs?: Array<unknown>;
						result?: { insertedCount?: number };
					};
					
					// With ordered: false, some documents might have been inserted before the error
					// Check if there are insertedDocs in the error
					if (errorObj.insertedDocs && Array.isArray(errorObj.insertedDocs)) {
						inserted += errorObj.insertedDocs.length;
						logger.info(`Partial insert: ${errorObj.insertedDocs.length} documents inserted before error`);
					}
					
					// Handle duplicate key errors (11000) or bulk write errors
					if (errorObj.code === 11000 || (errorObj.writeErrors && errorObj.writeErrors.length > 0)) {
						logger.warn(`Error in batch ${Math.floor(i / batchSize) + 1}, attempting individual inserts...`);
						
						// Try to insert individually to get actual count
						for (const item of batch) {
							try {
								await IndexInstrument.create(item);
								inserted++;
							} catch (individualError: unknown) {
								const individualErrorObj = individualError as { code?: number; message?: string };
								if (individualErrorObj.code === 11000) {
									// Duplicate key - skip it
									logger.debug(`Skipping duplicate: ${item.name} (${item.exchangeInstrumentId})`);
								} else {
									logger.error(`Error inserting individual index instrument ${item.name}:`, individualError);
									errors++;
								}
							}
						}
					} else {
						logger.error(`Error inserting index batch ${Math.floor(i / batchSize) + 1}:`, error);
						if (errorObj.writeErrors) {
							logger.error(`Write errors: ${JSON.stringify(errorObj.writeErrors)}`);
						}
						// Try individual inserts as fallback
						for (const item of batch) {
							try {
								await IndexInstrument.create(item);
								inserted++;
							} catch (individualError: unknown) {
								errors++;
							}
						}
					}
				}
			}

			// Verify insertion by counting documents in database
			const actualCount = await IndexInstrument.countDocuments({});
			logger.info(`Verification: ${actualCount} index instruments found in database after insertion`);

			const message = `Successfully updated index instruments. Inserted: ${inserted}, Errors: ${errors}, Actual count in DB: ${actualCount}`;
			logger.info(message);

			if (inserted > 0 && actualCount === 0) {
				logger.error("WARNING: Documents were reported as inserted but database count is 0!");
			}

			return {
				success: inserted > 0 && actualCount > 0,
				message,
				inserted: actualCount > 0 ? actualCount : inserted, // Return actual count if different
				errors,
			};
		} catch (error) {
			const errorMessage = `Failed to update index instruments: ${error}`;
			logger.error(errorMessage);
			logger.error(`Error details:`, error);
			return {
				success: false,
				message: errorMessage,
				inserted: 0,
				errors: 0,
			};
		}
	}

	/**
	 * Update instruments from a specific exchange segment
	 */
	async updateInstrumentsFromExchange(exchangeSegment: string): Promise<{
		success: boolean;
		message: string;
		inserted: number;
		updated: number;
		errors: number;
	}> {
		try {
			const apiData = await this.fetchInstrumentsFromAPI([exchangeSegment]);
			const instruments = this.parsePipeDelimitedData(apiData);

			logger.info(`Parsed ${instruments.length} instruments from ${exchangeSegment}`);

			let inserted = 0;
			const updated = 0;
			let errors = 0;

			// Clear existing data for this exchange segment
			const segmentNum = this.getExchangeSegmentFromString(exchangeSegment);
			await XtsInstrument.deleteMany({ exchangeSegment: segmentNum });

			// Insert new data in batches
			const batchSize = 1000;
			for (let i = 0; i < instruments.length; i += batchSize) {
				const batch = instruments.slice(i, i + batchSize);
				try {
					await XtsInstrument.insertMany(batch, { ordered: false });
					inserted += batch.length;
					logger.info(`Inserted batch ${Math.floor(i / batchSize) + 1} of ${Math.ceil(instruments.length / batchSize)}`);
				} catch (error: unknown) {
					// Handle duplicate key errors
					if ((error as { code?: number }).code === 11000) {
						// Some duplicates might exist, continue with next batch
						inserted += batch.length;
					} else {
						logger.error(`Error inserting batch:`, error);
						errors += batch.length;
					}
				}
			}

			const message = `Successfully updated ${exchangeSegment} instruments. Inserted: ${inserted}, Errors: ${errors}`;
			logger.info(message);

			return {
				success: true,
				message,
				inserted,
				updated,
				errors,
			};
		} catch (error) {
			const errorMessage = `Failed to update ${exchangeSegment} instruments: ${error}`;
			logger.error(errorMessage);
			return {
				success: false,
				message: errorMessage,
				inserted: 0,
				updated: 0,
				errors: 0,
			};
		}
	}

	/**
	 * Update all instruments from all exchanges
	 * OPTIMIZATION: Makes only ONE API call for all exchange segments and instrument types,
	 * then reuses the fetched data for both regular instruments and index instruments
	 */
	async updateAllInstruments(): Promise<{
		success: boolean;
		message: string;
		results: Record<string, unknown>;
		totalInserted: number;
		totalErrors: number;
	}> {
		const results: Record<string, unknown> = {};
		let totalInserted = 0;
		let totalErrors = 0;
		let allSuccess = true;

		// Fetch all instruments from API in a SINGLE call (optimized - no redundant calls)
		let allInstruments: XtsInstrumentData[] = [];
		try {
			logger.info("Fetching all instruments from API in a single call");
			const apiData = await this.fetchInstrumentsFromAPI(this.EXCHANGE_SEGMENTS);
			allInstruments = this.parsePipeDelimitedData(apiData);

			logger.info(`Parsed ${allInstruments.length} total instruments from API`);

			// Group instruments by exchange segment
			const instrumentsBySegment: Record<string, XtsInstrumentData[]> = {};
			for (const instrument of allInstruments) {
				const segmentKey = this.getExchangeSegmentKey(instrument.exchangeSegment);
				if (!instrumentsBySegment[segmentKey]) {
					instrumentsBySegment[segmentKey] = [];
				}
				instrumentsBySegment[segmentKey].push(instrument);
			}

			// Process each exchange segment
			for (const exchangeSegment of this.EXCHANGE_SEGMENTS) {
				try {
					const segmentNum = this.getExchangeSegmentFromString(exchangeSegment);
					const instruments = instrumentsBySegment[exchangeSegment] || [];

					logger.info(`Processing ${instruments.length} instruments for ${exchangeSegment}`);

					let inserted = 0;
					let errors = 0;

					// Clear existing data for this exchange segment
					await XtsInstrument.deleteMany({ exchangeSegment: segmentNum });

					// Insert new data in batches
					const batchSize = 1000;
					for (let i = 0; i < instruments.length; i += batchSize) {
						const batch = instruments.slice(i, i + batchSize);
						try {
							await XtsInstrument.insertMany(batch, { ordered: false });
							inserted += batch.length;
							logger.info(`Inserted batch ${Math.floor(i / batchSize) + 1} of ${Math.ceil(instruments.length / batchSize)} for ${exchangeSegment}`);
						} catch (error: unknown) {
							// Handle duplicate key errors
							if ((error as { code?: number }).code === 11000) {
								inserted += batch.length;
							} else {
								logger.error(`Error inserting batch for ${exchangeSegment}:`, error);
								errors += batch.length;
							}
						}
					}

					const result = {
						success: true,
						message: `Successfully updated ${exchangeSegment} instruments. Inserted: ${inserted}, Errors: ${errors}`,
						inserted,
						updated: 0,
						errors,
					};

					results[exchangeSegment] = result;
					totalInserted += inserted;
					totalErrors += errors;

					if (errors > 0) {
						allSuccess = false;
					}
				} catch (error) {
					results[exchangeSegment] = {
						success: false,
						message: `Error: ${error}`,
						inserted: 0,
						updated: 0,
						errors: 0,
					};
					allSuccess = false;
					totalErrors++;
				}
			}
		} catch (error) {
			logger.error("Error fetching all instruments from API:", error);
			// Fallback: try individual exchanges
			for (const exchangeSegment of this.EXCHANGE_SEGMENTS) {
				try {
					const result = await this.updateInstrumentsFromExchange(exchangeSegment);
					results[exchangeSegment] = result;
					totalInserted += result.inserted;
					totalErrors += result.errors;

					if (!result.success) {
						allSuccess = false;
					}
				} catch (err) {
					results[exchangeSegment] = {
						success: false,
						message: `Error: ${err}`,
						inserted: 0,
						updated: 0,
						errors: 0,
					};
					allSuccess = false;
					totalErrors++;
				}
			}
		}

		// Update index instruments using the already-fetched data (NO ADDITIONAL API CALL)
		// This reuses the data fetched above, avoiding redundant API requests
		try {
			const indexResult = await this.updateIndexInstruments(allInstruments);
			results["INDEX_INSTRUMENTS"] = indexResult;
			totalInserted += indexResult.inserted;
			totalErrors += indexResult.errors;

			if (!indexResult.success) {
				allSuccess = false;
			}
		} catch (error) {
			results["INDEX_INSTRUMENTS"] = {
				success: false,
				message: `Error: ${error}`,
				inserted: 0,
				errors: 0,
			};
			allSuccess = false;
			totalErrors++;
		}

		const message = allSuccess
			? `Successfully updated all instruments. Total inserted: ${totalInserted}, Total errors: ${totalErrors}`
			: `Partially updated instruments. Total inserted: ${totalInserted}, Total errors: ${totalErrors}`;

		return {
			success: allSuccess,
			message,
			results,
			totalInserted,
			totalErrors,
		};
	}

	/**
	 * Get exchange segment key from segment number
	 */
	private getExchangeSegmentKey(segmentNum: number): string {
		const segmentMap: Record<number, string> = {
			1: "NSECM",
			2: "NSEFO",
			3: "NSECD",
			11: "BSECM",
			12: "BSEFO",
			51: "MCXFO",
		};
		return segmentMap[segmentNum] || "NSECM";
	}

	/**
	 * Get exchange segment number from string
	 */
	private getExchangeSegmentFromString(exchangeString: string): number {
		const segments = {
			"NSECM": 1,   // NSE Cash Market
			"NSEFO": 2,   // NSE Futures & Options
			"NSECD": 3,   // NSE Currency Derivatives
			"BSECM": 11,  // BSE Cash Market
			"BSEFO": 12,  // BSE Futures & Options
			"MCXFO": 51,  // MCX Futures & Options
		};
		return segments[exchangeString as keyof typeof segments] || 1; // Default to 1 (NSECM)
	}

	/**
	 * Get instruments by exchange segment
	 */
	async getInstrumentsByExchange(exchangeSegment: string, limit = 100, skip = 0) {
		const segmentNum = this.getExchangeSegmentFromString(exchangeSegment);
		return await XtsInstrument.find({ exchangeSegment: segmentNum })
			.limit(limit)
			.skip(skip)
			.sort({ name: 1 });
	}

	/**
	 * Search instruments by name
	 */
	async searchInstruments(searchTerm: string, limit = 50) {
		return await XtsInstrument.find({
			name: { $regex: searchTerm, $options: "i" },
		})
			.limit(limit)
			.sort({ name: 1 });
	}

	/**
	 * Get instrument by token
	 */
	async getInstrumentByToken(token: number) {
		return await XtsInstrument.findOne({ instrumentToken: token });
	}

	/**
	 * Get instrument statistics
	 */
	async getInstrumentStats() {
		const stats = await XtsInstrument.aggregate([
			{
				$group: {
					_id: "$exchangeSegment",
					count: { $sum: 1 },
					instrumentTypes: { $addToSet: "$instrumentType" },
				},
			},
			{
				$lookup: {
					from: "xts_instruments",
					localField: "_id",
					foreignField: "exchangeSegment",
					as: "instruments",
				},
			},
		]);

		return {
			totalInstruments: await XtsInstrument.countDocuments(),
			exchangeStats: stats,
			lastUpdated: new Date(),
		};
	}
}

export default new XtsInstrumentsService();
