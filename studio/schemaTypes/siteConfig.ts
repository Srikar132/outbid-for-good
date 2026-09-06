import { defineField, defineType } from 'sanity'
import { CogIcon } from '@sanity/icons'

export const siteConfig = defineType({
  name: 'siteConfig',
  title: 'Site Config',
  type: 'document',
  icon: CogIcon,
  fields: [
    defineField({
      name: 'causeTitle',
      title: 'Cause title',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'causeBlurb',
      title: 'Cause blurb',
      type: 'text',
      rows: 4,
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'fundMessage',
      title: 'Fund routing message',
      type: 'text',
      rows: 2,
      description: 'e.g. "Funds go directly to a registered trust, not to this site."',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'minimumIncrement',
      title: 'Minimum bid increment',
      type: 'number',
      validation: (rule) => rule.required().min(1),
    }),
    defineField({
      name: 'creatorName',
      title: 'Creator display name',
      type: 'string',
      description: 'Leave unset until a partnership is confirmed — do not hardcode a real name in code.',
    }),
    defineField({
      name: 'creatorPhoto',
      title: 'Creator photo',
      type: 'image',
      options: { hotspot: true },
    }),
    defineField({
      name: 'creatorBlurb',
      title: 'Creator blurb',
      type: 'text',
      rows: 3,
    }),
  ],
  preview: {
    select: { title: 'causeTitle' },
    prepare({ title }) {
      return { title: title || 'Site Config' }
    },
  },
})
