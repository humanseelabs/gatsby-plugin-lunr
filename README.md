# Search Plugin for Gatsby

Gatsby plugin for full text search implementation based on Lunr.js client-side index. Supports multilanguage search. Search index is stored in /public directory and has to be downloaded on client entry.

## Getting Started

Install `gatsby-plugin-lunr`

```
    npm install --save gatsby-plugin-lunr
```

or

```
    yarn add gatsby-plugin-lunr
```

Add `gatsby-plugin-lunr` to the `gatsby-config.js` as follows

```javascript
module.exports = {
    plugins: [
        {
            resolve: `gatsby-plugin-lunr`,
            options: {
                // ISO 639-1 language codes. See https://lunrjs.com/guides/language_support.html for details
                languages: ['en', 'ru'],   
                // Fields to index. If store === true value will be stored in index file. 
                // Attributes for custom indexing logic. See https://lunrjs.com/docs/lunr.Builder.html for details
                fields: [
                    { name: 'title', store: true, attributes: { boost: 20 } },
                    { name: 'description', store: true },
                    { name: 'content' },
                    { name: 'url', store: true },
                ],
                // A fuction for filtering nodes. () => true by default
                filterNodes: node => node.frontmatter !== undefined && node.frontmatter.templateKey in mapPagesUrls,
                // // How to resolve each field's value for a supported node type
                resolvers: {
                    // For any node of type MarkdownRemark, list how to resolve the fields' values
                    MarkdownRemark: {
                        title: node => node.frontmatter.title,
                        description: node => node.frontmatter.description,
                        content: node => node.rawMarkdownBody,
                        url: node => mapPagesUrls[node.frontmatter.templateKey](node.fields.slug),
                    },
                },
            },
        },
    ],
}
```

## Consuming in Your Site

The search index will be available via window.**LUNR**. It's an object with fields: 'index' - a lunr index instance and 'store' - object where key is gatsby node ID and value is a collection of fileds values.

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
        const results = window.__LUNR__.index.search(query)
        return results.map(({ ref }) => window.__LUNR__.store[ref])
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
