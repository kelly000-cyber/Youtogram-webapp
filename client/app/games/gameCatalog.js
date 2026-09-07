export const gameCatalog = [
  {
    id: 'embed-demo-1',
    title: 'Replace With Your Game',
    description: 'Paste an iframe-friendly game URL into embedUrl below.',
    embedUrl: 'https://example.com',
    category: 'Arcade'
  },
  {
    id: 'embed-demo-2',
    title: 'Second Game Slot',
    description: 'Use this slot for another game provider URL.',
    embedUrl: 'https://example.com',
    category: 'Action'
  }
];

export const gameEmbedNote =
  'Only game URLs that allow iframe embedding will work. If the site blocks embedding with X-Frame-Options or Content-Security-Policy, it will not open inside the app.';
