import { defineField, defineType } from 'sanity'
import { StarIcon } from '@sanity/icons'

export const leaderboardEntry = defineType({
  name: 'leaderboardEntry',
  title: 'Leaderboard Entry',
  type: 'document',
  icon: StarIcon,
  fields: [
    defineField({
      name: 'displayName',
      title: 'Display name',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'companyName',
      title: 'Company name',
      type: 'string',
    }),
    defineField({
      name: 'logo',
      title: 'Logo',
      type: 'image',
      options: { hotspot: true },
    }),
    defineField({
      name: 'url',
      title: 'Website / handle URL',
      type: 'url',
      validation: (rule) =>
        rule.required().uri({ scheme: ['http', 'https'] }),
    }),
    defineField({
      name: 'tagline',
      title: 'Tagline',
      type: 'text',
      rows: 2,
      validation: (rule) => rule.max(140),
    }),
    defineField({
      name: 'category',
      title: 'Category',
      type: 'reference',
      to: [{ type: 'category' }],
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'cycle',
      title: 'Cycle',
      type: 'reference',
      to: [{ type: 'cycle' }],
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'amount',
      title: 'Amount',
      type: 'number',
      validation: (rule) => rule.required().min(1),
    }),
    defineField({
      name: 'clickCount',
      title: 'Click count',
      type: 'number',
      initialValue: 0,
      validation: (rule) => rule.min(0),
    }),
    defineField({
      name: 'razorpayOrderId',
      title: 'Razorpay order ID',
      type: 'string',
      readOnly: true,
    }),
    defineField({
      name: 'razorpayPaymentId',
      title: 'Razorpay payment ID',
      type: 'string',
      readOnly: true,
    }),
    defineField({
      name: 'status',
      title: 'Status',
      type: 'string',
      options: {
        list: [
          { title: 'Pending', value: 'pending' },
          { title: 'Confirmed', value: 'confirmed' },
          { title: 'Failed', value: 'failed' },
        ],
        layout: 'radio',
      },
      initialValue: 'pending',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'confirmedAt',
      title: 'Confirmed at',
      type: 'datetime',
    }),
  ],
  preview: {
    select: {
      title: 'displayName',
      amount: 'amount',
      status: 'status',
      media: 'logo',
    },
    prepare({ title, amount, status, media }) {
      return {
        title,
        subtitle: `₹${amount ?? 0} · ${status}`,
        media,
      }
    },
  },
})
