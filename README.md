# Search Plugin for Gatsby

Gatsby plugin for full text search implementation based on Lunr.js client-side index. It supports multilanguage search. Search index is placed into the /public folder during build time and has to be downloaded on client side on run time.

## Getting Started

Install `gatsby-plugin-lunr`

```
    npm install --save gatsby-plugin-lunr
```

or

```
    yarn add gatsby-plugin-lunr
```

Add `gatsby-plugin-lunr` configuration to the `gatsby-config.js` as following:

```javascript
module.exports = {
    plugins: [
        {
            resolve: `gatsby-plugin-lunr`,
            options: {
                languages: [
                    {
                        // ISO 639-1 language codes. See https://lunrjs.com/guides/language_support.html for details
                        name: 'en',
                        // A function for filtering nodes. () => true by default
                        filterNodes: node => node.frontmatter.lang === 'en',
                        // Add to index custom entries, that are not actually extracted from gatsby nodes
                        customEntries: [{ title: 'Pictures', content: 'awesome pictures', url: '/pictures' }],
                    },
                    {
                        name: 'fr',
                        filterNodes: node => node.frontmatter.lang === 'fr',
                    },
                ],
                // Fields to index. If store === true value will be stored in index file.
                // Attributes for custom indexing logic. See https://lunrjs.com/docs/lunr.Builder.html for details
                fields: [
                    { name: 'title', store: true, attributes: { boost: 20 } },
                    { name: 'content' },
                    { name: 'url', store: true },
                ],
                // How to resolve each field's value for a supported node type
                resolvers: {
                    // For any node of type MarkdownRemark, list how to resolve the fields' values
                    MarkdownRemark: {
                        title: node => node.frontmatter.title,
                        content: node => node.rawMarkdownBody,
                        url: node => node.fields.url,
                    },
                },
                //custom index file name, default is search_index.json
                filename: 'search_index.json',
                //custom options on fetch api call for search_ındex.json
                fetchOptions: {
                    credentials: 'same-origin'
                },

                // Set includeOptions if you want granular control over how the
                // Lunr JSON should be included on the site.
                // This will ensure that a large Lunr payload won't be
                // loaded until it is necessary.
                // Each path in the include or exclude properties will be
                // transformed into a regular expression for matching.
                // To use the default behaviour, which is to load it on the very
                // first page load, leave out or set to an empty object.
                includeOptions: {
                    include: [
                      '^\/search',
                      '^\/404',
                    ],
                    exclude: [
                      '^\/$',
                    ]
                },
            },
        },
    ],
}
```

### Using plugins
```javascript
const myPlugin = (lunr) => (builder) => {
  // removing stemmer
  builder.pipeline.remove(lunr.stemmer)
  builder.searchPipeline.remove(lunr.stemmer)
  // or similarity tuning
  builder.k1(1.3)
  builder.b(0)
}
```
Pass it to the `gatsby-config.js`:
...
languages: [
            {
             name: 'en',
             ...
             plugins: [myPlugin]
            }
           ]
...        

## Implementing Search in Your Web UI using Functional Components

The search data will be available on the client side via `window.__LUNR__` that is an object with the following fields:

-   `index` - a lunr index instance
-   `store` - object where the key is a gatsby node ID and value is a collection of field values.

```javascript
import React, { useState, useEffect } from 'react'
import { Link } from 'gatsby'

const Search = () => {
  const [query, setQuery] = useState(``)
  const [results, setResults] = useState([])

  useEffect(
    () => {
      if (!query || !window.__LUNR__) {
        setResults([])
        return
      }
      const lunrIndex = window.__LUNR__['en']
      const searchResults = lunrIndex.index.search(query)
      setResults(
        searchResults.map(({ ref }) => {
          return lunrIndex.store[ref]
        })
      )
    },
    [query]
  )

  return (
    <div>
      <input
        type='text'
        defaultValue={query}
        onChange={event => {
          setQuery(event.target.value)
        }}
      />
      <ul>
        {results.map(({ url, title }) => {
          return (
            <li key={url}>
              <Link to={url}>{title}</Link>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

export default Search
```

## Implementing Search in Your Web UI using Class Components

The search data will be available on the client side via `window.__LUNR__` that is an object with the following fields:

-   `index` - a lunr index instance
-   `store` - object where the key is a gatsby node ID and value is a collection of field values.

```javascript
import React, { Component } from 'react'

// Search component
export default class Search extends Component {
    constructor(props) {
        super(props)
        this.state = {
            query: ``,
            results: [],
        }
    }

    render() {
        return (
            <div>
                <input type="text" value={this.state.query} onChange={this.search} />
                <ul>{this.state.results.map(page => <li>{page.title}</li>)}</ul>
            </div>
        )
    }

    getSearchResults(query) {
        if (!query || !window.__LUNR__) return []
        const lunrIndex =  window.__LUNR__[this.props.lng];
        const results = lunrIndex.index.search(query) // you can  customize your search , see https://lunrjs.com/guides/searching.html
        return results.map(({ ref }) => lunrIndex.store[ref])
    }

    search = event => {
        const query = event.target.value
        const results = this.getSearchResults(query)
        this.setState(s => {
            return {
                results,
                query,
            }
        })
    }
}
```

Sample code and example on implementing search within gatsby starter project could be found in the article at: https://medium.com/humanseelabs/gatsby-v2-with-a-multi-language-search-plugin-ffc5e04f73bc

## Loading search index on specific pages

If you need to load the search index on specific pages, you can do so using
the `includeOptions` setting. With the `include` parameter you can set specific
page paths to include via regex, or you can exclude paths using the `exclude`
setting.

If you do this, you'll probably want to poll until `window.__LUNR__` is
available, to prevent trying to fetch the Lunr index while it hasn't been
loaded yet. You can do this within your React components by writing a
function that returns a Promise, and then using it to perform your search.

For example, this waits for up to 2 seconds for Lunr:

```javascript
const getLunr = (languageCode) => {
  return new Promise ((resolve, reject) => {
    const limit = 20;
    let attempts = 0;
    const interval = setInterval(() => {
      if (window.__LUNR__ && typeof window.__LUNR__[languageCode] === 'object') {
        clearInterval(interval);
        resolve(window.__LUNR__[languageCode]);
      }
      attempts += 1;
      if (attempts >= limit) {
        clearInterval(interval);
        reject();
      }
    }, 100);
  });
};
```

You can then call `getLunr(languageCode)` within your code, either in
a Promise chain or using async/await, and run searches on its index.

Depending on the file size of your index, you might want to change the
poll limit, or the time spent waiting in each polling iteration.
