import mongoose, { type Document, Schema } from "mongoose";

export interface IIndexInstrument extends Document {
	name: string;
	exchangeInstrumentId: number;
	createdAt: Date;
	updatedAt: Date;
}

const IndexInstrumentSchema = new Schema<IIndexInstrument>(
	{
		name: {
			type: String,
			required: true,
			trim: true,
			index: true,
		},
		exchangeInstrumentId: {
			type: Number,
			required: true,
			unique: true,
			index: true,
		},
	},
	{
		timestamps: true,
		collection: "index_instruments",
		toJSON: {
			transform: (_doc, ret) => {
				delete (ret as Record<string, unknown>).__v;
				return ret;
			},
		},
	},
);

// Index for faster searches
IndexInstrumentSchema.index({ name: 1 });
IndexInstrumentSchema.index({ exchangeInstrumentId: 1 });

// Static method to search by name
IndexInstrumentSchema.statics.searchByName = function (searchTerm: string) {
	return this.find({
		name: { $regex: searchTerm, $options: "i" },
	});
};

const IndexInstrument = mongoose.model<IIndexInstrument>("IndexInstrument", IndexInstrumentSchema);

export default IndexInstrument;

