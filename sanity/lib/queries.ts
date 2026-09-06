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
    "slug": slug.current,
    displayName,
    companyName,
    tagline,
    url,
    amount,
    clickCount,
    "confirmedAt": coalesce(confirmedAt, _createdAt),
    "category": category->{ _id, title, "slug": slug.current },
    logo
  }
`)

export const ENTRY_DETAIL_QUERY = defineQuery(/* groq */ `
  *[_type == "leaderboardEntry" && status == "confirmed" && slug.current == $slug][0] {
    _id,
    "slug": slug.current,
    displayName,
    companyName,
    tagline,
    url,
    amount,
    clickCount,
    raiseCount,
    "confirmedAt": coalesce(confirmedAt, _createdAt),
    "category": category->{ _id, title, "slug": slug.current },
    logo,
    "cycle": cycle->{ _id, title, startDate, endDate, isActive },
    "categoryRank": 1 + count(*[
      _type == "leaderboardEntry" && status == "confirmed" &&
      cycle._ref == ^.cycle._ref && category._ref == ^.category._ref &&
      amount > ^.amount
    ]),
    "categoryTotal": count(*[
      _type == "leaderboardEntry" && status == "confirmed" &&
      cycle._ref == ^.cycle._ref && category._ref == ^.category._ref
    ]),
    "overallRank": 1 + count(*[
      _type == "leaderboardEntry" && status == "confirmed" &&
      cycle._ref == ^.cycle._ref && amount > ^.amount
    ]),
    "overallTotal": count(*[
      _type == "leaderboardEntry" && status == "confirmed" &&
      cycle._ref == ^.cycle._ref
    ]),
    "siblings": *[
      _type == "leaderboardEntry" && status == "confirmed" &&
      cycle._ref == ^.cycle._ref && category._ref == ^.category._ref &&
      _id != ^._id
    ] | order(amount desc) [0...4] {
      _id,
      "slug": slug.current,
      displayName,
      companyName,
      amount,
      logo,
      "rank": 1 + count(*[
        _type == "leaderboardEntry" && status == "confirmed" &&
        cycle._ref == ^.cycle._ref && category._ref == ^.category._ref &&
        amount > ^.amount
      ])
    }
  }
`)
