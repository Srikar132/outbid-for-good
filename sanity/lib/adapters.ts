import type { Category, LeaderboardEntry } from '@/lib/mock-data'
import type { CategoryResult, LeaderboardEntryResult } from './data'

export function toCategory(result: CategoryResult): Category {
  return {
    slug: result.slug,
    title: result.title,
  }
}

export function toLeaderboardEntry(result: LeaderboardEntryResult): LeaderboardEntry {
  return {
    id: result._id,
    displayName: result.displayName,
    companyName: result.companyName ?? undefined,
    tagline: result.tagline ?? '',
    url: result.url,
    categorySlug: result.category.slug,
    amount: result.amount,
    clickCount: result.clickCount ?? 0,
    status: 'confirmed',
    confirmedAt: result.confirmedAt,
  }
}
