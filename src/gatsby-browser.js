/* global __PATH_PREFIX__ */
const lunr = require("lunr");
const { enhanceLunr } = require("./common.js");

exports.onClientEntry = (
    args,
    { languages, filename = "search_index.json" }
) => {
    // Setup a promise to be resolved/rejected after Lunr is loaded
    let resolveLoaded;
    let rejectLoaded;
    let loadedPromise = new Promise(function(resolve, reject) {
        resolveLoaded = resolve;
        rejectLoaded = reject;
    });
    window.__LUNR__ = window.__LUNR__ || {};
    window.__LUNR__.__loaded = loadedPromise;
    
    enhanceLunr(lunr, languages);
    fetch(`${__PATH_PREFIX__}/${filename}`)
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
            resolveLoaded(window.__LUNR__);
        })
        .catch(e => {
            rejectLoaded(new Error("Failed fetch search index"));
            console.log("Failed fetch search index");
        });
};
