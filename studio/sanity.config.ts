import { visionTool } from '@sanity/vision'
import { defineConfig } from 'sanity'
import { structureTool } from 'sanity/structure'

import { apiVersion, dataset, projectId } from './env'
import { schema } from './schemaTypes'
import { structure } from './structure'

export default defineConfig({
  name: 'default',
  title: 'OutBid for Good',

  projectId,
  dataset,

  schema,
  plugins: [
    structureTool({ structure }),
    // Vision lets you query with GROQ from inside the Studio
    // https://www.sanity.io/docs/the-vision-plugin
    visionTool({ defaultApiVersion: apiVersion }),
  ],
})
