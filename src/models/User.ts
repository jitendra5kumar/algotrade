// @ts-nocheck
import mongoose, { Schema } from 'mongoose';

const BrokerCredentialsSchema = new Schema(
  {
    broker: String,
    clientId: String,
    isConnected: { type: Boolean, default: false },
    connectedAt: Date,
    tokenGeneratedAt: Date,
    interactiveTokenEnc: String,
    interactiveExpiresAt: Date,
  },
  { _id: false }
);

const MarketDataCredentialsSchema = new Schema(
  {
    isActive: { type: Boolean, default: false },
    connectedAt: Date,
    lastRefresh: Date,
    expiry: Date,
    marketDataTokenEnc: String,
    marketDataExpiresAt: Date,
  },
  { _id: false }
);

const UserSchema = new Schema(
  {
    name: String,
    email: String,
    brokerCredentials: { type: BrokerCredentialsSchema, default: {} },
    marketDataCredentials: { type: MarketDataCredentialsSchema, default: {} },
  },
  { timestamps: true, strict: false }
);

export default mongoose.models.User || mongoose.model('User', UserSchema, 'users');


