import request from 'supertest';
import app from '../app';
import Strategy from '../models/Strategy.model';

describe('Strategies intraday fields', () => {
  it('creates strategy with intraday fields (simple create)', async () => {
    const payload = {
      strategyType: 'normal',
      signalsType: 'candleClose',
      symbol: 'RELIANCE',
      selectedInstrument: {
        name: 'RELIANCE',
        exchangeInstrumentID: 2885,
        exchangeSegment: 2,
        instrumentToken: 12345,
      },
      timeframe: '15min',
      productType: 'mis',
      orderType: 'market',
      qty: 1,
      stoplossEnabled: true,
      stoploss: 1,
      targetEnabled: true,
      target: 2,
      // New intraday fields
      intradayEnabled: true,
      tradingWindowEnabled: true,
      tradingStartTime: '09:20',
      tradingEndTime: '15:25',
      squareOffTime: '15:20',
      trailingStopLoss: 1.5,
      maxRiskPerTradePercent: 2,
      // indicators minimal
      selectedIndicators: [],
      indicatorConfig: {},
    } as any;

    const res = await request(app)
      .post('/api/strategies/simple')
      .send(payload)
      .expect(201);

    expect(res.body?.success).toBeTruthy();
    const sId = res.body?.data?._id || res.body?.data?.id;
    expect(sId).toBeTruthy();

    const created = await Strategy.findById(sId);
    expect(created).toBeTruthy();
    const cfg: any = created!.config as any;
    expect(cfg.intradayEnabled).toBe(true);
    expect(cfg.tradingWindowEnabled).toBe(true);
    expect(cfg.tradingStartTime).toBe('09:20');
    expect(cfg.tradingEndTime).toBe('15:25');
    expect(cfg.squareOffTime).toBe('15:20');
    expect(cfg.trailingStopLoss).toBe(1.5);
    expect(cfg.maxRiskPerTradePercent).toBe(2);
  });

  it('updates strategy intraday fields (simple update)', async () => {
    // First create
    const createRes = await request(app)
      .post('/api/strategies/simple')
      .send({
        strategyType: 'normal',
        signalsType: 'highLowBreak',
        symbol: 'INFY',
        selectedInstrument: { name: 'INFY', exchangeInstrumentID: 1594, exchangeSegment: 2, instrumentToken: 67890 },
        timeframe: '15min',
        productType: 'mis',
        orderType: 'market',
        qty: 2,
        stoplossEnabled: false,
        targetEnabled: false,
        selectedIndicators: [],
        indicatorConfig: {},
      })
      .expect(201);

    const id = createRes.body?.data?._id || createRes.body?.data?.id;
    expect(id).toBeTruthy();

    // Update intraday fields
    const updateRes = await request(app)
      .put(`/api/strategies/simple/${id}`)
      .send({
        strategy: 'custom',
        strategyType: 'normal',
        signalsType: 'highLowBreak',
        symbol: 'INFY',
        qty: 3,
        intradayEnabled: true,
        tradingWindowEnabled: false,
        squareOffTime: '15:10',
        trailingStopLoss: 0.8,
        maxRiskPerTradePercent: 1.2,
      })
      .expect(200);

    expect(updateRes.body?.success).toBeTruthy();
    const updated = await Strategy.findById(id);
    const cfg: any = updated!.config as any;
    expect(cfg.intradayEnabled).toBe(true);
    expect(cfg.tradingWindowEnabled).toBe(false);
    expect(cfg.squareOffTime).toBe('15:10');
    expect(cfg.trailingStopLoss).toBe(0.8);
    expect(cfg.maxRiskPerTradePercent).toBe(1.2);
  });
});


