// Live Content API — used only for confirmed leaderboard entries, the one
// query on the page that should update without a manual refresh. No token:
// serverToken/browserToken only gate reading *draft* content for Draft
// Mode/Presentation Tool preview, which this project doesn't use, and the
// dataset's public ACL means published content needs no token to read.
import { defineLive } from 'next-sanity/live'
import { client } from './client'

export const { sanityFetch, SanityLive } = defineLive({
  client,
  serverToken: false,
  browserToken: false,
})
