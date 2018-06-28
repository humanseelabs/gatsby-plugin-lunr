const enhanceLunr = (lunr, lngs) => {
  if (lngs.length) {
    require('lunr-languages/lunr.stemmer.support')(lunr)
    require('lunr-languages/lunr.multi')(lunr)
    lngs.forEach((lng) => {
      if (lng !== 'en') {
        try {
          require(`lunr-languages/lunr.${lng}`)(lunr)
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
