const lunr = require('lunr')
const { enhanceLunr } = require('./common.js')
const fs = require('fs')

exports.onPostBuild = ({ getNodes, getNode }, pluginOptions) => {
    const { languages = [], fields = [], resolvers = {} } = pluginOptions

    enhanceLunr(lunr, languages)

    const storeFields = fields.filter(f => f.store === true)

    const fullIndex = {}

    languages.forEach(({ name, filterNodes = () => true, customEntries = [] }) => {
        const store = {}
        const index = lunr(function() {
            if (name !== 'en') {
                this.use(lunr[name])
            }
            this.ref('id')
            fields.forEach(({ name, attributes = {} }) => {
                this.field(name, attributes)
            })

            getNodes()
                .filter(filterNodes)
                .forEach(n => {
                    const fieldResolvers = resolvers[n.internal.type]
                    if (fieldResolvers) {
                        const doc = {
                            id: n.id,
                            ...Object.keys(fieldResolvers).reduce(
                                (prev, key) => ({
                                    ...prev,
                                    [key]: fieldResolvers[key](n, getNode),
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

            customEntries.forEach((entry, index) => {
                const id = `custom_${index}`
                this.add({id , ...entry})
                store[id] = entry
            })
        })

        fullIndex[name] = { index, store }
    })

    fs.writeFileSync(`public/search_index.json`, JSON.stringify(fullIndex))
}
