import { createClient, type QueryParams } from 'next-sanity'

import { apiVersion, dataset, projectId } from '../env'

export const client = createClient({
  projectId,
  dataset,
  apiVersion,
  useCdn: true,
})

// For content that rarely changes (site config, categories, the active
// cycle) — CDN-backed, time-based revalidation. Confirmed leaderboard
// entries use `sanityFetch` from `live.ts` instead, since those need to
// update live rather than on a timer.
export function fetchCached<const Query extends string>(
  query: Query,
  params: QueryParams = {},
  revalidate = 60
) {
  return client.fetch(query, params, { next: { revalidate } })
}
