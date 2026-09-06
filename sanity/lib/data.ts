import { client } from './client'
import { token } from './token'
import {
  ACTIVE_CYCLE_QUERY,
  CATEGORIES_QUERY,
  CONFIRMED_ENTRIES_QUERY,
  SITE_CONFIG_QUERY,
} from './queries'

export type CategoryResult = {
  _id: string
  title: string
  slug: string
  description: string | null
}

export type CycleResult = {
  _id: string
  title: string | null
  startDate: string
  endDate: string
  isActive: boolean
}

export type SiteConfigResult = {
  _id: string
  causeTitle: string
  causeBlurb: string
  fundMessage: string
  minimumIncrement: number
  creatorName: string | null
  creatorPhotoUrl: string | null
  creatorBlurb: string | null
}

export type LeaderboardEntryResult = {
  _id: string
  displayName: string
  companyName: string | null
  tagline: string | null
  url: string
  amount: number
  clickCount: number
  confirmedAt: string | null
  category: { _id: string; title: string; slug: string } | null
  logoUrl: string | null
}

// Server-only: reads with a read token against the live API, never the CDN,
// since a stale leaderboard read is worse than a slightly slower one here.
const serverClient = client.withConfig({ token, useCdn: false })

export function getCategories() {
  return serverClient.fetch<CategoryResult[]>(CATEGORIES_QUERY)
}

export function getActiveCycle() {
  return serverClient.fetch<CycleResult | null>(ACTIVE_CYCLE_QUERY)
}

export function getSiteConfig() {
  return serverClient.fetch<SiteConfigResult | null>(SITE_CONFIG_QUERY)
}

export function getConfirmedEntries(cycleId: string) {
  return serverClient.fetch<LeaderboardEntryResult[]>(CONFIRMED_ENTRIES_QUERY, { cycleId })
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
