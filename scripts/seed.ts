/**
 * Seed Script Runner
 * Run with: pnpm tsx scripts/seed.ts
 */

import 'dotenv/config'
import { getPayload } from 'payload'
import config from '../src/payload.config'
import { seed } from '../src/seed'

async function runSeed() {
  const payload = await getPayload({ config })

  try {
    await seed(payload)
    console.log('Seed completed successfully!')
    process.exit(0)
  } catch (error) {
    console.error('Seed failed:', error)
    process.exit(1)
  }
}

runSeed()
