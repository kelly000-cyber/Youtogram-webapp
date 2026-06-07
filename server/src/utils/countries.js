const fs = require('fs');
const path = require('path');

let cachedCountries = null;

function loadCountries() {
  if (cachedCountries) return cachedCountries;

  const clientCountryFile = path.resolve(__dirname, '..', '..', '..', 'client', 'data', 'countries.js');
  const source = fs.readFileSync(clientCountryFile, 'utf8');
  const matches = [...source.matchAll(/\['([^']+)',\s*'([^']+)'\]/g)];

  cachedCountries = matches.reduce((map, [, name, dialCode]) => {
    map[name] = dialCode;
    return map;
  }, {});

  return cachedCountries;
}

exports.getDialCode = (country) => loadCountries()[country] || '';
