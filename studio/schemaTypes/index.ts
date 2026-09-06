import { type SchemaTypeDefinition } from 'sanity'

import { category } from './category'
import { cycle } from './cycle'
import { leaderboardEntry } from './leaderboardEntry'
import { siteConfig } from './siteConfig'

export const schema: { types: SchemaTypeDefinition[] } = {
  types: [category, cycle, leaderboardEntry, siteConfig],
}
