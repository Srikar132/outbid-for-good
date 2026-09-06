import type { StructureResolver } from 'sanity/structure'

const SINGLETONS = ['siteConfig']

// https://www.sanity.io/docs/structure-builder-cheat-sheet
export const structure: StructureResolver = (S) =>
  S.list()
    .title('Content')
    .items([
      S.listItem()
        .title('Site Config')
        .child(
          S.document().schemaType('siteConfig').documentId('siteConfig').title('Site Config')
        ),

      S.divider(),

      ...S.documentTypeListItems().filter(
        (listItem) => !SINGLETONS.includes(listItem.getId() as string)
      ),
    ])
