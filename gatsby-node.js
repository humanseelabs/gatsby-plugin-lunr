"use strict";

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; var ownKeys = Object.keys(source); if (typeof Object.getOwnPropertySymbols === 'function') { ownKeys = ownKeys.concat(Object.getOwnPropertySymbols(source).filter(function (sym) { return Object.getOwnPropertyDescriptor(source, sym).enumerable; })); } ownKeys.forEach(function (key) { _defineProperty(target, key, source[key]); }); } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

const lunr = require('lunr');

const {
  enhanceLunr
} = require('./common.js');

const fs = require('fs');

exports.onPostBuild = ({
  getNodes
}, pluginOptions) => {
  const {
    languages = [],
    filterNodes = () => true,
    fields = [],
    resolvers = {}
  } = pluginOptions;
  enhanceLunr(lunr, languages);
  const store = {};
  const storeFields = fields.filter(f => f.store === true);
  const index = lunr(function () {
    if (languages.length === 1) {
      this.use(lunr[languages[0]]);
    } else if (languages.length > 1) {
      this.use(lunr.multiLanguage(...languages));
    }

    this.ref('id');
    fields.forEach(({
      name,
      attributes = {}
    }) => {
      this.field(name, attributes);
    });
    getNodes().filter(filterNodes).forEach(n => {
      const fieldResolvers = resolvers[n.internal.type];

      if (fieldResolvers) {
        const doc = _objectSpread({
          id: n.id
        }, Object.keys(fieldResolvers).reduce((prev, key) => _objectSpread({}, prev, {
          [key]: fieldResolvers[key](n)
        }), {}));

        this.add(doc);
        store[n.id] = storeFields.reduce((acc, f) => _objectSpread({}, acc, {
          [f.name]: doc[f.name]
        }), {});
      }
    });
  });
  fs.writeFileSync(`public/search_index.json`, JSON.stringify({
    index,
    store
  }));
};