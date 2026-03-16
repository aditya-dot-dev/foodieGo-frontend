const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

export async function geocodeAddress(query: string) {
    if (!query || !MAPBOX_TOKEN) return [];

    const res = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
            query
        )}.json?access_token=${MAPBOX_TOKEN}&limit=5`
    );

    if (!res.ok) return [];

    const data = await res.json();
    return data.features || [];
}


export async function reverseGeocode(lat: number, lng: number) {
    const res = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${MAPBOX_TOKEN}`
    );
    const data = await res.json();
    return data.features;
}

export async function searchPlaces(query: string) {
  const res = await fetch(
    `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
      query
    )}.json?access_token=${MAPBOX_TOKEN}&autocomplete=true&limit=5`
  );

  if (!res.ok) return [];

  const data = await res.json();

  return (data.features || []).map((f: any) => {
    const context = f.context || [];

    const city =
      context.find((c: any) => c.id.includes('place'))?.text ||
      context.find((c: any) => c.id.includes('district'))?.text ||
      '';

    const area =
      context.find((c: any) => c.id.includes('neighborhood'))?.text ||
      context.find((c: any) => c.id.includes('locality'))?.text ||
      f.text;

    const pincode =
      context.find((c: any) => c.id.includes('postcode'))?.text || '';

    return {
      place_name: f.place_name,
      city,
      area,
      pincode,
      lat: f.center[1],
      lng: f.center[0],
    };
  });
}