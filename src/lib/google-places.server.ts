import { env } from "@/lib/settings.server";

// Google Places API (New) — Text Search. https://developers.google.com/maps/documentation/places/web-service/text-search
export type Place = {
  placeId: string; name: string; address: string | null; city: string | null; state: string | null;
  phone: string | null; website: string | null; rating: number | null; reviews: number | null; category: string | null; mapsUrl: string | null;
};

const FIELDS = [
  "places.id", "places.displayName", "places.formattedAddress", "places.addressComponents", "places.nationalPhoneNumber",
  "places.websiteUri", "places.rating", "places.userRatingCount", "places.primaryTypeDisplayName", "places.googleMapsUri",
  "places.businessStatus", "nextPageToken",
].join(",");

type Raw = {
  id: string; displayName?: { text: string }; formattedAddress?: string; nationalPhoneNumber?: string; websiteUri?: string;
  rating?: number; userRatingCount?: number; primaryTypeDisplayName?: { text: string }; googleMapsUri?: string; businessStatus?: string;
  addressComponents?: { longText: string; shortText: string; types: string[] }[];
};

export async function searchPlaces(query: string, pageToken?: string, pageSize = 20) {
  const key = env("GOOGLE_PLACES_API_KEY");
  if (!key) throw new Error("Configure a chave do Google Maps em Administração › Integrações");
  const res = await fetch("https://places.googleapis.com/v1/places:searchText", {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Goog-Api-Key": key, "X-Goog-FieldMask": FIELDS },
    body: JSON.stringify({ textQuery: query, languageCode: "pt-BR", regionCode: "BR", pageSize, ...(pageToken ? { pageToken } : {}) }),
    signal: AbortSignal.timeout(15_000),
  });
  const body = (await res.json().catch(() => ({}))) as { places?: Raw[]; nextPageToken?: string; error?: { message?: string } };
  if (!res.ok) throw new Error(`Google recusou a busca (${res.status}${body.error?.message ? `: ${body.error.message}` : ""})`);
  const comp = (p: Raw, type: string, short = false) => {
    const c = p.addressComponents?.find((x) => x.types.includes(type));
    return c ? (short ? c.shortText : c.longText) : null;
  };
  const places: Place[] = (body.places ?? [])
    .filter((p) => p.businessStatus !== "CLOSED_PERMANENTLY")
    .map((p) => ({
      placeId: p.id,
      name: p.displayName?.text ?? "Sem nome",
      address: p.formattedAddress ?? null,
      city: comp(p, "administrative_area_level_2"),
      state: comp(p, "administrative_area_level_1", true),
      phone: p.nationalPhoneNumber ?? null,
      website: p.websiteUri ?? null,
      rating: p.rating ?? null,
      reviews: p.userRatingCount ?? null,
      category: p.primaryTypeDisplayName?.text ?? null,
      mapsUrl: p.googleMapsUri ?? null,
    }));
  return { places, nextPageToken: body.nextPageToken ?? null };
}
