import mongoose, { type Document, Schema } from "mongoose";

export interface IXtsInstrument extends Document {
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
	underlyingInstrumentId?: number;
	underlyingIndexName?: string;
	contractExpiration?: string;
	expiry?: string;
	strikePrice?: number;
	optionType?: number | string;
	displayName?: string;
	priceNumerator?: number;
	priceDenominator?: number;
	detailedDescription?: string;
	isin?: string;
	unknownFieldOne?: number;
	unknownFieldTwo?: number;
	unknownFieldThree?: number;
	createdAt: Date;
	updatedAt: Date;
}

const XtsInstrumentSchema = new Schema<IXtsInstrument>(
	{
		exchangeSegment: {
			type: Number,
			required: true,
			index: true,
		},
		exchangeInstrumentID: {
			type: Number,
			required: true,
			unique: true,
			index: true,
		},
		instrumentType: {
			type: Number,
			required: true,
			index: true,
		},
		name: {
			type: String,
			required: true,
			trim: true,
			index: true,
		},
		description: {
			type: String,
			required: true,
			trim: true,
		},
		series: {
			type: String,
			required: true,
			trim: true,
			index: true,
		},
		nameWithSeries: {
			type: String,
			trim: true,
		},
		instrumentToken: {
			type: Number,
			required: true,
			unique: true,
			index: true,
		},
		priceBandHigh: {
			type: Number,
			default: null,
		},
		priceBandLow: {
			type: Number,
			default: null,
		},
		freezeQty: {
			type: Number,
			default: null,
		},
		lotSize: {
			type: Number,
			required: true,
			default: 1,
		},
		tickSize: {
			type: Number,
			required: true,
			default: 0.05,
		},
		multiplier: {
			type: Number,
			default: 1,
		},
		underlyingInstrumentId: {
			type: Number,
			default: null,
		},
		underlyingIndexName: {
			type: String,
			trim: true,
			default: "",
		},
		contractExpiration: {
			type: String,
			trim: true,
			default: "",
		},
		expiry: {
			type: String,
			trim: true,
			index: true,
			default: "",
		},
		optionType: {
			type: Schema.Types.Mixed,
			default: null,
		},
		strikePrice: {
			type: Number,
			default: 0,
		},
		displayName: {
			type: String,
			trim: true,
			default: "",
		},
		priceNumerator: {
			type: Number,
			default: null,
		},
		priceDenominator: {
			type: Number,
			default: null,
		},
		detailedDescription: {
			type: String,
			trim: true,
			default: "",
		},
		isin: {
			type: String,
			trim: true,
			index: true,
			default: "",
		},
		unknownFieldOne: {
			type: Number,
			default: null,
		},
		unknownFieldTwo: {
			type: Number,
			default: null,
		},
		unknownFieldThree: {
			type: Number,
			default: null,
		},
	},
	{
		timestamps: true,
		collection: "xts_instruments",
		toJSON: {
			transform: (_doc, ret) => {
				delete (ret as Record<string, unknown>).__v;
				return ret;
			},
		},
	},
);

// Compound indexes for better query performance
XtsInstrumentSchema.index({ exchangeSegment: 1, instrumentType: 1 });
XtsInstrumentSchema.index({ name: 1, series: 1 });
XtsInstrumentSchema.index({ expiry: 1, optionType: 1, strikePrice: 1 });

// Static method to get instruments by exchange segment
XtsInstrumentSchema.statics.getByExchangeSegment = function (segment: number) {
	return this.find({ exchangeSegment: segment });
};

// Static method to get instruments by type
XtsInstrumentSchema.statics.getByInstrumentType = function (type: number) {
	return this.find({ instrumentType: type });
};

// Static method to search instruments by name
XtsInstrumentSchema.statics.searchByName = function (searchTerm: string) {
	return this.find({
		name: { $regex: searchTerm, $options: "i" },
	});
};

// Static method to get options by underlying
XtsInstrumentSchema.statics.getOptionsByUnderlying = function (underlying: string) {
	return this.find({
		instrumentType: 2, // Options
		name: { $regex: underlying, $options: "i" },
	});
};

// Static method to get futures by underlying
XtsInstrumentSchema.statics.getFuturesByUnderlying = function (underlying: string) {
	return this.find({
		instrumentType: 1, // Futures
		name: { $regex: underlying, $options: "i" },
	});
};

const XtsInstrument = mongoose.model<IXtsInstrument>("XtsInstrument", XtsInstrumentSchema);

export default XtsInstrument;
