"use strict";

const lunr = require('lunr');

const {
  enhanceLunr
} = require('./common.js');

exports.onClientEntry = (args, {
  languages
}) => {
  enhanceLunr(lunr, languages);
  fetch('/search_index.json').then(function (response) {
    return response.json();
  }).then(function ({
    index,
    store
  }) {
    window.__LUNR__ = {
      index: lunr.Index.load(index),
      store
    };
  }).catch(e => console.log('Failed fetch search index'));
};