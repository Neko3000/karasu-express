import configPromise from '@payload-config'
import { getPayload } from 'payload'

export const GET = async () => {
  // Example: Get payload instance for custom API routes
  const payload = await getPayload({ config: configPromise })

  // Return server info as example
  return Response.json({
    message: 'This is an example of a custom route.',
    serverURL: payload.config.serverURL,
  })
}
