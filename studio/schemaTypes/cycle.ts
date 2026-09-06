import { defineField, defineType } from 'sanity'
import { CalendarIcon } from '@sanity/icons'

export const cycle = defineType({
  name: 'cycle',
  title: 'Cycle',
  type: 'document',
  icon: CalendarIcon,
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      description: 'Studio-facing label only, e.g. "2026 Q3".',
    }),
    defineField({
      name: 'startDate',
      title: 'Start date',
      type: 'date',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'endDate',
      title: 'End date',
      type: 'date',
      validation: (rule) =>
        rule.required().custom((endDate, context) => {
          const startDate = (context.document as { startDate?: string } | undefined)?.startDate
          if (startDate && endDate && new Date(endDate) < new Date(startDate)) {
            return 'End date must be after start date'
          }
          return true
        }),
    }),
    defineField({
      name: 'isActive',
      title: 'Active',
      type: 'boolean',
      description: 'Only one cycle should be active at a time. The public leaderboard reads from whichever cycle is active.',
      initialValue: false,
      validation: (rule) =>
        rule.custom(async (isActive, context) => {
          if (!isActive) return true

          const client = context.getClient({ apiVersion: '2026-09-06' })
          const id = context.document?._id?.replace(/^drafts\./, '')

          const otherActiveCount = await client.fetch(
            `count(*[_type == "cycle" && isActive == true && _id != $id && _id != $draftId])`,
            { id, draftId: `drafts.${id}` }
          )

          return otherActiveCount === 0 || 'Another cycle is already active. Mark it inactive first.'
        }),
    }),
  ],
  preview: {
    select: { title: 'title', startDate: 'startDate', endDate: 'endDate', isActive: 'isActive' },
    prepare({ title, startDate, endDate, isActive }) {
      return {
        title: title || `${startDate ?? '?'} — ${endDate ?? '?'}`,
        subtitle: isActive ? 'Active' : 'Inactive',
      }
    },
  },
})
