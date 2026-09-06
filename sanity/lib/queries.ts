import { defineQuery } from 'next-sanity'

export const CATEGORIES_QUERY = defineQuery(/* groq */ `
  *[_type == "category"] | order(title asc) {
    _id,
    title,
    "slug": slug.current,
    description
  }
`)

export const ACTIVE_CYCLE_QUERY = defineQuery(/* groq */ `
  *[_type == "cycle" && isActive == true][0] {
    _id,
    title,
    startDate,
    endDate,
    isActive
  }
`)

export const SITE_CONFIG_QUERY = defineQuery(/* groq */ `
  *[_id == "siteConfig"][0] {
    _id,
    causeTitle,
    causeBlurb,
    fundMessage,
    minimumIncrement,
    creatorName,
    "creatorPhotoUrl": creatorPhoto.asset->url,
    creatorBlurb
  }
`)

export const CONFIRMED_ENTRIES_QUERY = defineQuery(/* groq */ `
  *[_type == "leaderboardEntry" && status == "confirmed" && cycle._ref == $cycleId]
  | order(amount desc) {
    _id,
    displayName,
    companyName,
    tagline,
    url,
    amount,
    clickCount,
    confirmedAt,
    "category": category->{ _id, title, "slug": slug.current },
    "logoUrl": logo.asset->url
  }
`)
