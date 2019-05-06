const enhanceLunr = (lunr, lngs) => {
  if (lngs.length) {
    require('lunr-languages/lunr.stemmer.support')(lunr)
    lngs.forEach(({name}) => {
      if (name !== 'en') {
        try {
          if (name === 'jp' || name === 'ja') {
            require(`lunr-languages/tinyseg`)(lunr)
          }
          require(`lunr-languages/lunr.${name}`)(lunr)
        } catch (e) {
          console.log(e)
        }
      }
    })
  }
}

module.exports = {
  enhanceLunr,
}
