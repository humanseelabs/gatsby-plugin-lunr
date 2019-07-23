const lunr = require("lunr");
const { enhanceLunr } = require("./common.js");
const fs = require("fs");


exports.onCreateWebpackConfig = ({ actions, plugins }, { languages = [] }) => {
    const languageNames = new Set(languages.map(language => language.name));

    actions.setWebpackConfig({
        plugins: [
            plugins.ignore({
                checkResource(resource, context) {
                    if (/lunr-languages$/.test(context)) {
                        const match = resource.match(/lunr\.(\w+)/);
                        if (match !== null) {
                            const name = match[1];
                            if (!languageNames.has(name)) {
                                // Skip the resource.
                                return true;
                            };
                        }
                    }
                }
            })
        ]
    });
}

exports.onPostBootstrap = ({ getNodes, getNode }, pluginOptions) => {
    const {
        languages = [],
        fields = [],
        resolvers = {},
        filename = "search_index.json"
    } = pluginOptions;

    enhanceLunr(lunr, languages);

    const storeFields = fields.filter(f => f.store === true);

    const fullIndex = {};

    languages.forEach(
        ({
            name,
            filterNodes = () => true,
            customEntries = [],
            plugins = []
        }) => {
            const store = {};
            const index = lunr(function() {
                plugins.forEach(plugin => {
                    this.use(plugin(lunr));
                });
                if (name !== "en") {
                    this.use(lunr[name]);
                }
                this.ref("id");
                fields.forEach(({ name, attributes = {} }) => {
                    this.field(name, attributes);
                });

                getNodes()
                    .filter(filterNodes)
                    .forEach(n => {
                        const fieldResolvers = resolvers[n.internal.type];
                        if (fieldResolvers) {
                            const doc = {
                                id: n.id,
                                ...Object.keys(fieldResolvers).reduce(
                                    (prev, key) => ({
                                        ...prev,
                                        [key]: fieldResolvers[key](n, getNode)
                                    }),
                                    {}
                                )
                            };
                            this.add(doc);

                            store[n.id] = storeFields.reduce(
                                (acc, f) => ({
                                    ...acc,
                                    [f.name]: doc[f.name]
                                }),
                                {}
                            );
                        }
                    });

                customEntries.forEach((entry, index) => {
                    const id = `custom_${index}`;
                    this.add({ id, ...entry });
                    store[id] = entry;
                });
            });

            fullIndex[name] = { index, store };
        }
    );

    fs.writeFileSync(`public/${filename}`, JSON.stringify(fullIndex));
};
