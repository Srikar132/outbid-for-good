import { defineField, defineType } from 'sanity'
import { CogIcon } from '@sanity/icons'

export const siteConfig = defineType({
  name: 'siteConfig',
  title: 'Site Config',
  type: 'document',
  icon: CogIcon,
  fieldsets: [
    { name: 'hero', title: 'Home page hero card', options: { collapsible: true, collapsed: false } },
  ],
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
    // Hero card on the home page. Every field is optional and each element
    // renders only when filled, so the card makes no claim that hasn't been
    // entered deliberately. Leave the trust chips empty until an audit or
    // public ledger genuinely exists — this is donor-facing copy about where
    // real money goes.
    defineField({
      name: 'heroImage',
      title: 'Hero image',
      type: 'image',
      description: 'Wide photo of the cause in action. Nothing renders if unset.',
      options: { hotspot: true },
      fieldset: 'hero',
    }),
    defineField({
      name: 'heroImageAlt',
      title: 'Hero image alt text',
      type: 'string',
      description: 'Describe the photo for screen readers and when the image fails to load.',
      fieldset: 'hero',
    }),
    defineField({
      name: 'heroBadge',
      title: 'Hero badge',
      type: 'string',
      description: 'Small pill on the image, e.g. "Live field action".',
      fieldset: 'hero',
    }),
    defineField({
      name: 'heroStatValue',
      title: 'Hero stat',
      type: 'string',
      description: 'Headline figure, e.g. "12.4 tonnes cleared". Only publish a number you can evidence.',
      fieldset: 'hero',
    }),
    defineField({
      name: 'heroStatCaption',
      title: 'Hero stat caption',
      type: 'string',
      description: 'Context line under the stat, e.g. the location or period it covers.',
      fieldset: 'hero',
    }),
    defineField({
      name: 'heroChips',
      title: 'Hero trust chips',
      type: 'array',
      of: [{ type: 'string' }],
      description:
        'Short trust labels shown beside the stat. Add one ONLY if it is verifiably true — these read to a donor as guarantees about their money.',
      validation: (rule) => rule.max(3),
      fieldset: 'hero',
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
