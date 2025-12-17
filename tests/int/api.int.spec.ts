import { getPayload, Payload } from 'payload'
import config from '@/payload.config'

import { describe, it, beforeAll, expect } from 'vitest'

// Skip if required environment variables are not set
const hasRequiredEnv = process.env.PAYLOAD_SECRET && process.env.DATABASE_URI

let payload: Payload

describe.skipIf(!hasRequiredEnv)('API', () => {
  beforeAll(async () => {
    const payloadConfig = await config
    payload = await getPayload({ config: payloadConfig })
  })

  it('fetches users', async () => {
    const users = await payload.find({
      collection: 'users',
    })
    expect(users).toBeDefined()
  })
})
