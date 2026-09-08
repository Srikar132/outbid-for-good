import { createClient } from 'next-sanity'

import { apiVersion, dataset, projectId } from '../env'

// Server-only. Never import this from a client component — the token has
// write access to the dataset. Used to create pending leaderboard entries
// at order-creation time (and, later, to confirm them from the webhook).
export const writeClient = createClient({
  projectId,
  dataset,
  apiVersion,
  useCdn: false,
  token: process.env.SANITY_API_WRITE_TOKEN,
})

export function assertWriteToken() {
  if (!process.env.SANITY_API_WRITE_TOKEN) {
    throw new Error('Missing environment variable: SANITY_API_WRITE_TOKEN')
  }
}
