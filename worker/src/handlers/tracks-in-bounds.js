export async function handleTracksInBounds(request, env) {
  const { searchParams } = new URL(request.url);
  const north = parseFloat(searchParams.get("north"));
  const south = parseFloat(searchParams.get("south"));
  const east = parseFloat(searchParams.get("east"));
  const west = parseFloat(searchParams.get("west"));

  if ([north, south, east, west].some(v => isNaN(v))) {
    return new Response("Invalid bounds", { status: 400 });
  }

  const indexJSON = await env.TRACKS_KV.get("track-index");
  if (!indexJSON) return new Response("No index", { status: 404 });

  const index = JSON.parse(indexJSON);
  const results = index.filter(track =>
    !(track.maxLat < south || track.minLat > north || track.maxLon < west || track.minLon > east)
  );

  return Response.json(results.map(t => ({ slug: t.slug })));
}
