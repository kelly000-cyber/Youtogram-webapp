const fs = require('fs');
const path = require('path');

let cachedCountries = null;

function loadCountries() {
  if (cachedCountries) return cachedCountries;

  const clientCountryFile = path.resolve(__dirname, '..', '..', '..', 'client', 'data', 'countries.js');
  let source = '';

  try {
    source = fs.readFileSync(clientCountryFile, 'utf8');
  } catch (error) {
    cachedCountries = {
      Nigeria: '+234',
      Ghana: '+233',
      Kenya: '+254',
      'South Africa': '+27',
      'United Kingdom': '+44',
      'United States': '+1',
      Canada: '+1'
    };
    return cachedCountries;
  }

  const matches = [...source.matchAll(/\['([^']+)',\s*'([^']+)'\]/g)];

  cachedCountries = matches.reduce((map, [, name, dialCode]) => {
    map[name] = dialCode;
    return map;
  }, {});

  return cachedCountries;
}

exports.getDialCode = (country) => loadCountries()[country] || '';
