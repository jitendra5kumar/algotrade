import 'dotenv/config'
import axios from 'axios'
import socketIoClient from 'socket.io-client'
import logger from '../utils/logger'

async function main() {
  const baseRoot = 'https://algozy.rathi.com'
  const baseHttp = `${baseRoot}/apimarketdata`
  const baseSocket = baseRoot
  const socketPath = '/apimarketdata/socket.io'

  const appKey = process.env.MARKET_DATA_API_KEY || 'c1bbad7f9b5e2ac0cf5802'
  const secretKey = process.env.MARKET_DATA_API_SECRET || 'Rsyg217#oV'
  const userId = process.env.MARKET_DATA_CLIENT_ID
  if (!userId) {
    throw new Error('MARKET_DATA_CLIENT_ID environment variable is required for this script')
  }
  // MCX Futures: exchangeSegment 51, instrumentId 457886 (CrudeOil 19Nov25 Fut)
  const instruments = [{ exchangeSegment: 51, exchangeInstrumentID: 457886 }]

  try {
    // Login to get token (REST)
    const login = await axios.post(`${baseHttp}/auth/login`, { appKey, secretKey, source: 'WEBAPI' }, {
      headers: { 'Content-Type': 'application/json' },
    })
    const token = (Array.isArray(login.data) ? login.data[0] : login.data)?.result?.token
    if (!token) throw new Error('No token from login')
    logger.info('Login success', { tokenLength: token.length })

    // Socket.IO v2 connection as per docs
    const socket = socketIoClient(baseSocket, {
      path: socketPath,
      reconnection: true,
      reconnectionDelay: 2000,
      reconnectionDelayMax: 20000,
      reconnectionAttempts: 10,
      query: {
        token,
        userID: userId,
        publishFormat: 'JSON',
        broadcastMode: 'Full',
        transports: ['websocket'],
        EIO: 3,
      },
    })

    socket.on('connect', async () => {
      logger.info('Socket connected (marketdata)')

      // Subscribe for SBIN 3045 via REST subscription endpoint
      try {
        await axios.post(`${baseHttp}/instruments/subscription`, {
          instruments,
          xtsMessageCode: 1502,
        }, { headers: { Authorization: token, 'Content-Type': 'application/json' } })
        logger.info('Subscription requested', { code: 1502, instruments })

        await axios.post(`${baseHttp}/instruments/subscription`, {
          instruments,
          xtsMessageCode: 1512,
        }, { headers: { Authorization: token, 'Content-Type': 'application/json' } })
        logger.info('Subscription requested', { code: 1512, instruments })
      } catch (e: any) {
        logger.error('Subscription request failed', { status: e?.response?.status, data: e?.response?.data })
      }
    })

    socket.on('disconnect', (reason: string) => {
      logger.warn('Socket disconnected', { reason })
    })
    socket.on('error', (err: unknown) => logger.error('Socket error', { err }))

    // Listen to documented events
    socket.on('1502-json-full', (data: unknown) => {
      const body = typeof data === 'string' ? data : JSON.stringify(data)
      console.log('[SBIN 3045 1502 FULL]', new Date().toISOString(), body)
    })
    socket.on('1502-json-partial', (data: unknown) => {
      const body = typeof data === 'string' ? data : JSON.stringify(data)
      console.log('[SBIN 3045 1502 PART]', new Date().toISOString(), body)
    })
    socket.on('1512-json-full', (data: unknown) => {
      const body = typeof data === 'string' ? data : JSON.stringify(data)
      console.log('[SBIN 3045 1512 FULL]', new Date().toISOString(), body)
    })
    socket.on('1512-json-partial', (data: unknown) => {
      const body = typeof data === 'string' ? data : JSON.stringify(data)
      console.log('[SBIN 3045 1512 PART]', new Date().toISOString(), body)
    })

    process.stdin.resume()
  } catch (e: any) {
    logger.error('Marketdata socket script failed', { error: e?.message, data: e?.response?.data })
    process.exit(1)
  }
}

void main()


