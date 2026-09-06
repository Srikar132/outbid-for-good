import type {
  ACTIVE_CYCLE_QUERY_RESULT,
  CATEGORIES_QUERY_RESULT,
  CONFIRMED_ENTRIES_QUERY_RESULT,
  ENTRY_DETAIL_QUERY_RESULT,
  SITE_CONFIG_QUERY_RESULT,
} from '@/sanity.types'
import { fetchCached } from './client'
import { sanityFetch } from './live'
import {
  ACTIVE_CYCLE_QUERY,
  CATEGORIES_QUERY,
  CONFIRMED_ENTRIES_QUERY,
  ENTRY_DETAIL_QUERY,
  SITE_CONFIG_QUERY,
} from './queries'

export type CategoryResult = CATEGORIES_QUERY_RESULT[number]
export type CycleResult = NonNullable<ACTIVE_CYCLE_QUERY_RESULT>
export type SiteConfigResult = NonNullable<SITE_CONFIG_QUERY_RESULT>
export type LeaderboardEntryResult = CONFIRMED_ENTRIES_QUERY_RESULT[number]
export type EntryDetailResult = NonNullable<ENTRY_DETAIL_QUERY_RESULT>

export function getCategories() {
  return fetchCached(CATEGORIES_QUERY, {}, 3600)
}

export function getActiveCycle() {
  return fetchCached(ACTIVE_CYCLE_QUERY, {}, 60)
}

export function getSiteConfig() {
  return fetchCached(SITE_CONFIG_QUERY, {}, 3600)
}

export async function getConfirmedEntries(cycleId: string) {
  const { data } = await sanityFetch({ query: CONFIRMED_ENTRIES_QUERY, params: { cycleId } })
  return data
}

export async function getEntryDetail(slug: string) {
  const { data } = await sanityFetch({ query: ENTRY_DETAIL_QUERY, params: { slug } })
  return data
}

export async function getLeaderboardData() {
  const [cycle, categories, siteConfig] = await Promise.all([
    getActiveCycle(),
    getCategories(),
    getSiteConfig(),
  ])

  const entries = cycle ? await getConfirmedEntries(cycle._id) : []

  return { cycle, categories, siteConfig, entries }
}
