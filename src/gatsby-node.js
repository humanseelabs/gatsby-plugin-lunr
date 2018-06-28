const lunr = require('lunr')
const { enhanceLunr } = require('./common.js')
const fs = require('fs-extra')

exports.onPostBuild = ({ getNodes }, pluginOptions) => {
  const { languages = [], filterNodes = () => true, fields = [], resolvers = {} } = pluginOptions
  enhanceLunr(lunr, languages)

  const store = {}
  const storeFields = fields.filter((f) => f.store === true)

  const index = lunr(function() {
    if (languages.length === 1) {
      this.use(lunr[languages[0]])
    } else if (languages.length > 1) {
      this.use(lunr.multiLanguage(...languages))
    }

    this.ref('id')
    fields.forEach(({ name, attributes = {} }) => {
      this.field(name, attributes)
    })

    getNodes()
      .filter(filterNodes)
      .forEach((n) => {
        const fieldResolvers = resolvers[n.internal.type]
        if (fieldResolvers) {
          const doc = {
            id: n.id,
            ...Object.keys(fieldResolvers).reduce(
              (prev, key) => ({
                ...prev,
                [key]: fieldResolvers[key](n),
              }),
              {},
            ),
          }
          this.add(doc)

          store[n.id] = storeFields.reduce(
            (acc, f) => ({
              ...acc,
              [f.name]: doc[f.name],
            }),
            {},
          )
        }
      })
  })
  fs.writeFileSync(`public/search_index.json`, JSON.stringify({ index, store }))
}
