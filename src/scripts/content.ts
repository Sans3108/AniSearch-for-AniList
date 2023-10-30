(async () => {
  console.log(`Processing ${document.URL}`);

  //#region Helper functions
  function getElementByPath(path: string) {
    return document.querySelector(path);
  }
  //#endregion

  //#region Constants
  const awButtonId = 'aw_button';
  //#endregion

  const url = 'https://graphql.anilist.co';
  const query = `
query ($id: Int) {
  Media (id: $id, type: ANIME) {
    id
    title {
      romaji
      english
      native
    }
    season,
    seasonYear,
    format
  }
}
`;

  type Season = 'WINTER' | 'SPRING' | 'SUMMER' | 'FALL';

  type Format = 'TV' | 'TV_SHORT' | 'MOVIE' | 'SPECIAL' | 'OVA' | 'ONA' | 'MUSIC' | 'MANGA' | 'NOVEL' | 'ONE_SHOT';

  type Anime = {
    id: number;
    title: {
      romaji: string | null;
      english: string | null;
      native: string | null;
    };
    season: Season | null;
    seasonYear: number | null;
    format: Format | null;
  };

  const variables = { id: document.URL.split('/')[4] };

  const data = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query,
      variables
    })
  }).catch(error => {
    console.error(error);
    return null;
  });

  if (!data) return console.error(`API ERROR!`);

  const anime: Anime = (await data.json()).data.Media;

  // Get the title in order of preference

  const order = ['native', 'romaji', 'english'];
  const titles = [
    { lang: 'native', title: anime.title.native },
    { lang: 'romaji', title: anime.title.romaji },
    { lang: 'english', title: anime.title.english }
  ];

  titles.sort((a, b) => order.indexOf(a.lang) - order.indexOf(b.lang));

  const title = titles.find(t => t.title !== null)?.title || null;

  if (!title) throw new Error('Title was not found!');

  console.log(`Found title!`, title);

  // Construct the button

  console.log('Constructing button...');

  const awButton = document.createElement('div');

  awButton.id = awButtonId;

  // Redirect
  const endpoint = new URL('https://aniwave.to/filter');

  endpoint.searchParams.set('keyword', title);
  endpoint.searchParams.set('sort', 'most_relevance');

  const year = anime.seasonYear;
  if (year) endpoint.searchParams.set('year', `${year}`);

  if (anime.format) {
    const valid = ['movie', 'tv', 'ova', 'ona', 'special', 'music'].includes(anime.format.toLowerCase());

    if (valid) endpoint.searchParams.set('type', anime.format.toLowerCase());
  }

  if (anime.season) {
    endpoint.searchParams.set('season', anime.season.toLowerCase());
  }

  awButton.onclick = function () {
    window.open(endpoint, '_blank');
  };

  // Append the button to the action panel
  const actionPanel = getElementByPath(`#app > div.page-content > div > div.header-wrap > div > div > div.cover-wrap > div > div`);
  if (!actionPanel) throw new Error('Action Panel was not found!');

  actionPanel.appendChild(awButton);
  console.log('Button was appended to the action panel!');
})().catch((e: Error) => {
  console.error(e);
});
