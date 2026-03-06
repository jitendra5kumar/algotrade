// @ts-nocheck
import mongoose, { Schema } from 'mongoose';

const BrokerSessionSchema = new Schema(
  {
    userId: { type: String, required: true, index: true },
    broker: { type: String, required: true },
    clientId: { type: String, required: true },
    accessTokenEnc: { type: String, required: true },
    marketDataTokenEnc: { type: String },
    refreshTokenEnc: { type: String },
    connectedAt: { type: Date, default: () => new Date() },
    expiresAt: { type: Date, required: true },
    mdExpiresAt: { type: Date },
    meta: { type: Schema.Types.Mixed }
  },
  { timestamps: true }
);

export default mongoose.models.BrokerSession ||
  mongoose.model('BrokerSession', BrokerSessionSchema);


