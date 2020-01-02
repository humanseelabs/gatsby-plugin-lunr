/* global __PATH_PREFIX__ */
const lunr = require("lunr");
const { enhanceLunr } = require("./common.js");

const matchesAny = (path, matches) => matches.filter(f => {
    return f.match(new RegExp(f));
});

const shouldIncludeLunr = (path, { include = [], exclude = [] }) =>
    matchesAny(path, include) && !matchesAny(path, exclude);

const includeLunr = (filename = "search_index.json", fetchOptions = {}) => {
    window.__LUNR__ = window.__LUNR__ || {};
    if (window.__LUNR__.__loaded) {
        return;
    }
    window.__LUNR__.__loaded = fetch(
        `${__PATH_PREFIX__}/${filename}`,
        fetchOptions
    )
        .then(function(response) {
            return response.json();
        })
        .then(function(fullIndex) {
            window.__LUNR__ = Object.keys(fullIndex).reduce(
                (prev, key) => ({
                    ...prev,
                    [key]: {
                        index: lunr.Index.load(fullIndex[key].index),
                        store: fullIndex[key].store
                    }
                }),
                {
                    __loaded: window.__LUNR__.__loaded
                }
            );
            return window.__LUNR__;
        })
        .catch(e => {
            console.log("Failed fetch search index");
            throw e;
        });
};

exports.onClientEntry = (
    args,
    {
        languages,
        filename,
        fetchOptions,
        includeOptions = {},
    }
) => {
    enhanceLunr(lunr, languages);
    if (!Object.keys(includeOptions).length) {
        includeLunr(filename, fetchOptions);
    }
};

exports.onPreRouteUpdate = (
    { location, prevLocation },
    {
        filename,
        fetchOptions,
        includeOptions = {},
    }
) => {
    if (
        Object.keys(includeOptions).length &&
        shouldIncludeLunr(path, includeOptions)
    ) {
        includeLunr(filename, fetchOptions);
    }
};
