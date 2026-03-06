import 'dotenv/config';
import mongoose from 'mongoose';
import IndexInstrument from '../models/IndexInstrument.model';
import logger from '../utils/logger';

// Index instruments data
const indexInstruments = [
	{ name: 'NIFTY 50', exchangeInstrumentId: 26000 },
	{ name: 'NIFTY BANK', exchangeInstrumentId: 26001 },
	{ name: 'INDIA VIX', exchangeInstrumentId: 26002 },
	{ name: 'NIFTY IT', exchangeInstrumentId: 26003 },
	{ name: 'NIFTY 100', exchangeInstrumentId: 26004 },
	{ name: 'NIFTY MIDCAP 50', exchangeInstrumentId: 26005 },
	{ name: 'NIFTY GS 11 15YR', exchangeInstrumentId: 26006 },
	{ name: 'NIFTY INFRA', exchangeInstrumentId: 26007 },
	{ name: 'NIFTY100 LIQ 15', exchangeInstrumentId: 26008 },
	{ name: 'NIFTY REALTY', exchangeInstrumentId: 26009 },
	{ name: 'NIFTY CPSE', exchangeInstrumentId: 26010 },
	{ name: 'NIFTY GS COMPSITE', exchangeInstrumentId: 26011 },
	{ name: 'NIFTY OIL AND GAS', exchangeInstrumentId: 26012 },
	{ name: 'NIFTY50 TR 1X INV', exchangeInstrumentId: 26013 },
	{ name: 'NIFTY PHARMA', exchangeInstrumentId: 26014 },
	{ name: 'NIFTY PSE', exchangeInstrumentId: 26015 },
	{ name: 'NIFTY MIDCAP 150', exchangeInstrumentId: 26016 },
	{ name: 'NIFTY MIDCAP 100', exchangeInstrumentId: 26017 },
	{ name: 'NIFTY SERV SECTOR', exchangeInstrumentId: 26018 },
	{ name: 'NIFTY 500', exchangeInstrumentId: 26019 },
	{ name: 'NIFTY ALPHA 50', exchangeInstrumentId: 26020 },
	{ name: 'NIFTY50 VALUE 20', exchangeInstrumentId: 26021 },
	{ name: 'NIFTY200 QUALTY30', exchangeInstrumentId: 26022 },
	{ name: 'NIFTY SMLCAP 250', exchangeInstrumentId: 26023 },
	{ name: 'NIFTY GROWSECT 15', exchangeInstrumentId: 26024 },
	{ name: 'NIFTY50 PR 1X INV', exchangeInstrumentId: 26025 },
	{ name: 'NIFTY50 EQL WGT', exchangeInstrumentId: 26026 },
	{ name: 'NIFTY PSU BANK', exchangeInstrumentId: 26027 },
	{ name: 'NIFTY SMLCAP 100', exchangeInstrumentId: 26028 },
	{ name: 'NIFTY LARGEMID250', exchangeInstrumentId: 26029 },
	{ name: 'NIFTY100 EQL WGT', exchangeInstrumentId: 26030 },
	{ name: 'NIFTY SMLCAP 50', exchangeInstrumentId: 26031 },
	{ name: 'NIFTY ENERGY', exchangeInstrumentId: 26032 },
	{ name: 'NIFTY GS 10YR', exchangeInstrumentId: 26033 },
	{ name: 'NIFTY FIN SERVICE', exchangeInstrumentId: 26034 },
	{ name: 'NIFTY MIDSML 400', exchangeInstrumentId: 26035 },
	{ name: 'NIFTY METAL', exchangeInstrumentId: 26036 },
	{ name: 'NIFTY CONSR DURBL', exchangeInstrumentId: 26037 },
	{ name: 'NIFTY DIV OPPS 50', exchangeInstrumentId: 26038 },
	{ name: 'NIFTY GS 15YRPLUS', exchangeInstrumentId: 26039 },
	{ name: 'NIFTY MEDIA', exchangeInstrumentId: 26040 },
	{ name: 'NIFTY FMCG', exchangeInstrumentId: 26041 },
	{ name: 'NIFTY PVT BANK', exchangeInstrumentId: 26042 },
	{ name: 'NIFTY200MOMENTM30', exchangeInstrumentId: 26043 },
	{ name: 'HANGSENG BEES-NAV', exchangeInstrumentId: 26044 },
	{ name: 'NIFTY100 LOWVOL30', exchangeInstrumentId: 26045 },
	{ name: 'NIFTY50 TR 2X LEV', exchangeInstrumentId: 26046 },
	{ name: 'NIFTY CONSUMPTION', exchangeInstrumentId: 26047 },
	{ name: 'NIFTY GS 8 13YR', exchangeInstrumentId: 26048 },
	{ name: 'NIFTY100ESGSECLDR', exchangeInstrumentId: 26049 },
	{ name: 'NIFTY GS 10YR CLN', exchangeInstrumentId: 26050 },
	{ name: 'NIFTY GS 4 8YR', exchangeInstrumentId: 26051 },
	{ name: 'NIFTY AUTO', exchangeInstrumentId: 26052 },
	{ name: 'NIFTY COMMODITIES', exchangeInstrumentId: 26053 },
	{ name: 'NIFTY NEXT 50', exchangeInstrumentId: 26054 },
	{ name: 'NIFTY MNC', exchangeInstrumentId: 26055 },
	{ name: 'NIFTY MID LIQ 15', exchangeInstrumentId: 26056 },
	{ name: 'NIFTY HEALTHCARE', exchangeInstrumentId: 26057 },
	{ name: 'NIFTY500 MULTICAP', exchangeInstrumentId: 26058 },
	{ name: 'NIFTY ALPHALOWVOL', exchangeInstrumentId: 26059 },
	{ name: 'NIFTY FINSRV25 50', exchangeInstrumentId: 26060 },
	{ name: 'NIFTY50 PR 2X LEV', exchangeInstrumentId: 26061 },
	{ name: 'NIFTY100 QUALTY30', exchangeInstrumentId: 26062 },
	{ name: 'NIFTY50 DIV POINT', exchangeInstrumentId: 26063 },
	{ name: 'NIFTY 200', exchangeInstrumentId: 26064 },
	{ name: 'NIFTY MID SELECT', exchangeInstrumentId: 26121 },
	{ name: 'NIFTY MIDSML HLTH', exchangeInstrumentId: 26122 },
	{ name: 'NIFTY MULTI INFRA', exchangeInstrumentId: 26123 },
	{ name: 'NIFTY MULTI MFG', exchangeInstrumentId: 26124 },
	{ name: 'NIFTY TATA 25 CAP', exchangeInstrumentId: 26125 },
	{ name: 'NIFTY IND DEFENCE', exchangeInstrumentId: 26127 },
	{ name: 'NIFTY IND TOURISM', exchangeInstrumentId: 26128 },
	{ name: 'NIFTY CAPITAL MKT', exchangeInstrumentId: 26129 },
	{ name: 'NIFTY500MOMENTM50', exchangeInstrumentId: 26130 },
	{ name: 'NIFTYMS400 MQ 100', exchangeInstrumentId: 26131 },
	{ name: 'NIFTYSML250MQ 100', exchangeInstrumentId: 26132 },
	{ name: 'NIFTY TOP 10 EW', exchangeInstrumentId: 26133 },
	{ name: 'BHARATBOND-APR25', exchangeInstrumentId: 26134 },
	{ name: 'BHARATBOND-APR30', exchangeInstrumentId: 26135 },
	{ name: 'BHARATBOND-APR31', exchangeInstrumentId: 26136 },
	{ name: 'BHARATBOND-APR32', exchangeInstrumentId: 26137 },
	{ name: 'BHARATBOND-APR33', exchangeInstrumentId: 26138 },
	{ name: 'NIFTY AQL 30', exchangeInstrumentId: 26139 },
	{ name: 'NIFTY AQLV 30', exchangeInstrumentId: 26140 },
	{ name: 'NIFTY EV', exchangeInstrumentId: 26141 },
	{ name: 'NIFTY HIGHBETA 50', exchangeInstrumentId: 26142 },
	{ name: 'NIFTY NEW CONSUMP', exchangeInstrumentId: 26143 },
	{ name: 'NIFTY CORP MAATR', exchangeInstrumentId: 26144 },
	{ name: 'NIFTY LOW VOL 50', exchangeInstrumentId: 26145 },
	{ name: 'NIFTY MOBILITY', exchangeInstrumentId: 26146 },
	{ name: 'NIFTY QLTY LV 30', exchangeInstrumentId: 26147 },
	{ name: 'NIFTY SML250 Q50', exchangeInstrumentId: 26148 },
	{ name: 'NIFTY TOP 15 EW', exchangeInstrumentId: 26149 },
	{ name: 'NIFTY100 ALPHA 30', exchangeInstrumentId: 26150 },
	{ name: 'NIFTY100 ENH ESG', exchangeInstrumentId: 26151 },
	{ name: 'NIFTY200 VALUE 30', exchangeInstrumentId: 26152 },
	{ name: 'NIFTY500 EW', exchangeInstrumentId: 26153 },
	{ name: 'NIFTY MULTI MQ 50', exchangeInstrumentId: 26154 },
	{ name: 'NIFTY500 VALUE 50', exchangeInstrumentId: 26155 },
	{ name: 'NIFTY TOP 20 EW', exchangeInstrumentId: 26156 },
	{ name: 'NIFTY COREHOUSING', exchangeInstrumentId: 26157 },
	{ name: 'NIFTY FINSEREXBNK', exchangeInstrumentId: 26158 },
	{ name: 'NIFTY HOUSING', exchangeInstrumentId: 26159 },
	{ name: 'NIFTY IPO', exchangeInstrumentId: 26160 },
	{ name: 'NIFTY MS FIN SERV', exchangeInstrumentId: 26161 },
	{ name: 'NIFTY MS IND CONS', exchangeInstrumentId: 26162 },
	{ name: 'NIFTY MS IT TELCM', exchangeInstrumentId: 26163 },
	{ name: 'NIFTY NONCYC CONS', exchangeInstrumentId: 26164 },
	{ name: 'NIFTY RURAL', exchangeInstrumentId: 26165 },
	{ name: 'NIFTY SHARIAH 25', exchangeInstrumentId: 26166 },
	{ name: 'NIFTY TRANS LOGIS', exchangeInstrumentId: 26167 },
	{ name: 'NIFTY50 SHARIAH', exchangeInstrumentId: 26168 },
	{ name: 'NIFTY500 LMS EQL', exchangeInstrumentId: 26169 },
	{ name: 'NIFTY500 SHARIAH', exchangeInstrumentId: 26170 },
	{ name: 'NIFTY MICROCAP 250', exchangeInstrumentId: 26171 },
];

async function updateIndexInstruments() {
	try {
		// Connect to MongoDB
		const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/algotrade';
		await mongoose.connect(mongoUri);
		logger.info('Connected to MongoDB');

		// Delete all existing index instruments
		const deleteResult = await IndexInstrument.deleteMany({});
		logger.info(`Deleted ${deleteResult.deletedCount} existing index instruments`);

		// Insert new data
		const insertResult = await IndexInstrument.insertMany(indexInstruments, { ordered: false });
		logger.info(`Inserted ${insertResult.length} new index instruments`);

		logger.info(`\n✅ Successfully updated index instruments`);
		logger.info(`   - Deleted: ${deleteResult.deletedCount} records`);
		logger.info(`   - Inserted: ${insertResult.length} records`);

		await mongoose.connection.close();
		logger.info('MongoDB connection closed');
		process.exit(0);
	} catch (error) {
		logger.error('Error updating index instruments:', error);
		await mongoose.connection.close();
		process.exit(1);
	}
}

// Run if called directly
if (require.main === module) {
	updateIndexInstruments();
}

export default updateIndexInstruments;

