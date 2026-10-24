export function countyPath(county) {
  return `/counties/${encodeURIComponent(county.slug)}`;
}

export function filterCounties(counties, search) {
  const query = search.trim().toLocaleLowerCase("en-KE");
  return counties.filter((county) => county.name.toLocaleLowerCase("en-KE").includes(query));
}
