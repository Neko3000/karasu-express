import { mongooseAdapter } from '@payloadcms/db-mongodb'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import path from 'path'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'
import sharp from 'sharp'

import { Users } from './collections/Users'
import { Media } from './collections/Media'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
    meta: {
      titleSuffix: '- Karasu Studio',
      description: 'AI Content Generation Studio',
    },
    avatar: 'default',
    dateFormat: 'MMMM do yyyy, h:mm a',
  },
  collections: [Users, Media],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: mongooseAdapter({
    url: process.env.DATABASE_URI || '',
  }),
  sharp,
  plugins: [],
  upload: {
    limits: {
      fileSize: 50 * 1024 * 1024, // 50MB max file size
    },
  },
  // Only set serverURL in production - in development, leaving it undefined avoids URL duplication bugs
  // See: https://github.com/payloadcms/payload/issues - formatAdminURL returns full URL which gets
  // concatenated with serverURL again in createLocalReq, causing "http://localhost:3000http://localhost:3000/admin"
  serverURL: process.env.NEXT_PUBLIC_SERVER_URL || '',
  cors: [
    process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000',
  ].filter(Boolean),
  csrf: [
    process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000',
  ].filter(Boolean),
})
