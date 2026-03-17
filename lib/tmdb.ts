const BASE = "https://api.themoviedb.org/3";
const BASE_V4 = "https://api.themoviedb.org/4";
const IMG = "https://image.tmdb.org/t/p";

type TmdbMethod = "GET" | "POST" | "DELETE";

type TmdbRequestOptions = {
  noStore?: boolean;
};

type TmdbDetailedResult<T> =
  | { ok: true; status: number; data: T }
  | { ok: false; status: number; message: string };

function headers() {
  return {
    Authorization: `Bearer ${process.env.TMDB_ACCESS_TOKEN}`,
    "Content-Type": "application/json",
  };
}

function withSessionId(path: string, sessionId?: string) {
  const normalizedSessionId = sessionId?.trim();

  if (!normalizedSessionId) {
    return path;
  }

  const separator = path.includes("?") ? "&" : "?";

  return `${path}${separator}session_id=${encodeURIComponent(normalizedSessionId)}`;
}

async function tmdb<T>(path: string, options?: TmdbRequestOptions): Promise<T | null> {
  try {
    const res = await fetch(`${BASE}${path}`, {
      headers: headers(),
      cache: options?.noStore ? "no-store" : undefined,
      next: options?.noStore ? { revalidate: 0 } : { revalidate: 3600 },
    });

    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

async function tmdbRequest<T>(
  path: string,
  method: TmdbMethod,
  body?: unknown,
  options?: TmdbRequestOptions
): Promise<T | null> {
  try {
    const res = await fetch(`${BASE}${path}`, {
      method,
      headers: headers(),
      body: body ? JSON.stringify(body) : undefined,
      cache: options?.noStore ? "no-store" : undefined,
      next:
        options?.noStore
          ? { revalidate: 0 }
          : method === "GET"
          ? { revalidate: 3600 }
          : { revalidate: 0 },
    });

    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

async function tmdbRequestDetailed<T>(
  path: string,
  method: TmdbMethod,
  body?: unknown,
  options?: TmdbRequestOptions
): Promise<TmdbDetailedResult<T>> {
  try {
    const res = await fetch(`${BASE}${path}`, {
      method,
      headers: headers(),
      body: body ? JSON.stringify(body) : undefined,
      cache: options?.noStore ? "no-store" : undefined,
      next:
        options?.noStore
          ? { revalidate: 0 }
          : method === "GET"
          ? { revalidate: 3600 }
          : { revalidate: 0 },
    });

    const payload = await res.json().catch(() => null);

    if (!res.ok) {
      const message =
        payload &&
        typeof payload === "object" &&
        "status_message" in payload &&
        typeof (payload as { status_message?: unknown }).status_message === "string"
          ? String((payload as { status_message: string }).status_message)
          : res.statusText || "TMDB request failed.";

      return { ok: false, status: res.status, message };
    }

    return { ok: true, status: res.status, data: payload as T };
  } catch {
    return { ok: false, status: 0, message: "Network error while contacting TMDB." };
  }
}

async function tmdbRequestV4<T>(
  path: string,
  method: TmdbMethod,
  body?: unknown,
  options?: TmdbRequestOptions
): Promise<T | null> {
  try {
    const res = await fetch(`${BASE_V4}${path}`, {
      method,
      headers: headers(),
      body: body ? JSON.stringify(body) : undefined,
      cache: options?.noStore ? "no-store" : undefined,
      next:
        options?.noStore
          ? { revalidate: 0 }
          : method === "GET"
          ? { revalidate: 3600 }
          : { revalidate: 0 },
    });

    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

async function tmdbRequestV4Detailed<T>(
  path: string,
  method: TmdbMethod,
  body?: unknown,
  options?: TmdbRequestOptions
): Promise<TmdbDetailedResult<T>> {
  try {
    const res = await fetch(`${BASE_V4}${path}`, {
      method,
      headers: headers(),
      body: body ? JSON.stringify(body) : undefined,
      cache: options?.noStore ? "no-store" : undefined,
      next:
        options?.noStore
          ? { revalidate: 0 }
          : method === "GET"
          ? { revalidate: 3600 }
          : { revalidate: 0 },
    });

    const payload = await res.json().catch(() => null);

    if (!res.ok) {
      const message =
        payload &&
        typeof payload === "object" &&
        "status_message" in payload &&
        typeof (payload as { status_message?: unknown }).status_message === "string"
          ? String((payload as { status_message: string }).status_message)
          : res.statusText || "TMDB v4 request failed.";

      return { ok: false, status: res.status, message };
    }

    return { ok: true, status: res.status, data: payload as T };
  } catch {
    return { ok: false, status: 0, message: "Network error while contacting TMDB." };
  }
}

/* ───────────────────────── Types ───────────────────────── */

export interface TmdbMediaResult {
  id: number;
  title?: string;
  name?: string;
  original_title?: string;
  original_name?: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date?: string;
  first_air_date?: string;
  vote_average: number;
  genre_ids: number[];
  media_type?: "movie" | "tv" | "person";
  origin_country?: string[];
  original_language: string;
}

export interface TmdbGenre {
  id: number;
  name: string;
}

export interface TmdbVideoResult {
  id: string;
  key: string;
  name: string;
  site: string;
  type: string;
  official: boolean;
  published_at?: string;
}

export interface TmdbImageAsset {
  file_path: string;
  width: number;
  height: number;
  aspect_ratio: number;
  vote_average: number;
  vote_count: number;
  iso_639_1: string | null;
}

export interface TmdbCastMember {
  id: number;
  name: string;
  original_name?: string;
  character?: string;
  job?: string;
  known_for_department?: string;
  profile_path: string | null;
  order?: number;
}

export interface TmdbCrewMember {
  id: number;
  name: string;
  original_name?: string;
  department: string;
  job: string;
  known_for_department?: string;
  profile_path: string | null;
}

export interface TmdbPersonCredit extends TmdbMediaResult {
  character?: string;
  job?: string;
  department?: string;
  episode_count?: number;
}

export interface TmdbExternalIds {
  imdb_id?: string | null;
  facebook_id?: string | null;
  instagram_id?: string | null;
  tiktok_id?: string | null;
  twitter_id?: string | null;
  youtube_id?: string | null;
  wikidata_id?: string | null;
}

export interface TmdbAccountStates {
  id: number;
  favorite?: boolean;
  watchlist?: boolean;
  rated?: boolean | { value: number };
}

export interface TmdbReleaseDateEntry {
  certification: string;
  iso_639_1: string;
  release_date: string;
  type: number;
}

export interface TmdbReleaseDateResult {
  iso_3166_1: string;
  release_dates: TmdbReleaseDateEntry[];
}

export interface TmdbContentRatingResult {
  iso_3166_1: string;
  rating: string;
}

export interface TmdbSeasonSummary {
  id: number;
  name: string;
  overview: string;
  air_date?: string;
  episode_count: number;
  poster_path: string | null;
  season_number: number;
  vote_average?: number;
}

export interface TmdbEpisodeSummary {
  id: number;
  name: string;
  overview: string;
  air_date?: string;
  episode_number: number;
  runtime?: number;
  season_number: number;
  still_path: string | null;
  vote_average: number;
  vote_count?: number;
  crew?: TmdbCrewMember[];
  guest_stars?: TmdbCastMember[];
}

export interface TmdbMediaDetail extends TmdbMediaResult {
  genres: TmdbGenre[];
  homepage?: string;
  imdb_id?: string | null;
  origin_country?: string[];
  popularity?: number;
  production_companies?: Array<{
    id: number;
    name: string;
    logo_path: string | null;
    origin_country: string;
  }>;
  status?: string;
  tagline?: string;
  vote_count?: number;
  credits?: {
    cast: TmdbCastMember[];
    crew: TmdbCrewMember[];
  };
  videos?: {
    results: TmdbVideoResult[];
  };
  images?: {
    backdrops: TmdbImageAsset[];
    posters: TmdbImageAsset[];
    logos?: TmdbImageAsset[];
  };
  recommendations?: TmdbPageResponse<TmdbMediaResult>;
  runtime?: number;
  release_dates?: {
    results: TmdbReleaseDateResult[];
  };
  content_ratings?: {
    results: TmdbContentRatingResult[];
  };
  episode_run_time?: number[];
  number_of_episodes?: number;
  number_of_seasons?: number;
  seasons?: TmdbSeasonSummary[];
  created_by?: Array<{
    id: number;
    name: string;
    profile_path: string | null;
  }>;
  last_air_date?: string;
  next_episode_to_air?: TmdbEpisodeSummary | null;
  last_episode_to_air?: TmdbEpisodeSummary | null;
}

export interface TmdbSeasonDetail extends TmdbSeasonSummary {
  episodes: TmdbEpisodeSummary[];
  credits?: {
    cast: TmdbCastMember[];
    crew: TmdbCrewMember[];
  };
  videos?: {
    results: TmdbVideoResult[];
  };
  images?: {
    posters: TmdbImageAsset[];
  };
}

export interface TmdbEpisodeDetail extends TmdbEpisodeSummary {
  crew: TmdbCrewMember[];
  guest_stars: TmdbCastMember[];
  images?: {
    stills: TmdbImageAsset[];
  };
  videos?: {
    results: TmdbVideoResult[];
  };
}

export interface TmdbPersonDetail {
  id: number;
  name: string;
  biography: string;
  birthday?: string;
  deathday?: string | null;
  gender?: number;
  homepage?: string | null;
  imdb_id?: string | null;
  known_for_department?: string;
  place_of_birth?: string;
  profile_path: string | null;
  also_known_as: string[];
  combined_credits?: {
    cast: TmdbPersonCredit[];
    crew: TmdbPersonCredit[];
  };
  images?: {
    profiles: TmdbImageAsset[];
  };
  external_ids?: TmdbExternalIds;
}

export interface TmdbPageResponse<T> {
  page: number;
  results: T[];
  total_pages: number;
  total_results: number;
}

export interface TmdbApiStatusResponse {
  success: boolean;
  status_code: number;
  status_message: string;
}

export interface TmdbAuthTokenResponse {
  success: boolean;
  expires_at: string;
  request_token: string;
}

export interface TmdbSessionResponse {
  success: boolean;
  session_id: string;
}

export interface TmdbAccountDetails {
  id: number;
  name?: string;
  username?: string;
}

export interface TmdbLoginSessionResponse {
  session_id: string;
  account_id?: number;
}

export interface TmdbAccountListSummary {
  id: number;
  name: string;
  description: string;
  favorite_count: number;
  item_count: number;
  list_type: string;
  iso_639_1: string;
  poster_path: string | null;
}

export interface TmdbListDetail {
  id: number;
  name: string;
  description: string;
  item_count: number;
  items: TmdbMediaResult[];
  iso_639_1: string;
  poster_path: string | null;
}

export interface TmdbWatchlistDetail {
  page: number;
  total_pages: number;
  total_results: number;
  results: TmdbMediaResult[];
}

export type TmdbMutationError = {
  status: number;
  message: string;
};

/* ───────────────────────── Images ───────────────────────── */

export function posterUrl(path: string | null, size = "w500") {
  return path ? `${IMG}/${size}${path}` : null;
}

export function backdropUrl(path: string | null, size = "w1280") {
  return path ? `${IMG}/${size}${path}` : null;
}

export function profileUrl(path: string | null, size = "w185") {
  return path ? `${IMG}/${size}${path}` : null;
}

/* ───────────────────────── Search ───────────────────────── */

export async function searchTmdbMedia(query: string): Promise<TmdbMediaResult[]> {
  const data = await tmdb<{ results: TmdbMediaResult[] }>(
    `/search/multi?query=${encodeURIComponent(query)}&include_adult=false&page=1`
  );

  return (data?.results ?? [])
    .filter((r) => r.media_type === "movie" || r.media_type === "tv")
    .slice(0, 8);
}

/* ───────────────────────── Trending ───────────────────────── */

export async function getTrendingMedia(
  mediaType: "all" | "movie" | "tv" = "all",
  timeWindow: "day" | "week" = "week",
  page = 1
): Promise<TmdbPageResponse<TmdbMediaResult> | null> {
  return tmdb<TmdbPageResponse<TmdbMediaResult>>(
    `/trending/${mediaType}/${timeWindow}?page=${page}`
  );
}

/* ───────────────────────── Discover ───────────────────────── */

export async function discoverTmdbMedia(
  mediaType: "movie" | "tv" = "movie",
  page = 1
): Promise<TmdbPageResponse<TmdbMediaResult> | null> {
  return tmdb<TmdbPageResponse<TmdbMediaResult>>(
    `/discover/${mediaType}?include_adult=false&page=${page}`
  );
}

/* ───────────────────────── Fetch by ID ───────────────────────── */

export async function getTmdbMovie(id: number) {
  return tmdb<TmdbMediaDetail>(
    `/movie/${id}?append_to_response=credits,videos,images,recommendations,release_dates`
  );
}

export async function getTmdbTv(id: number) {
  return tmdb<TmdbMediaDetail>(
    `/tv/${id}?append_to_response=credits,videos,images,recommendations,content_ratings`
  );
}

export async function getTmdbSeason(
  seriesId: number,
  seasonNumber: number
): Promise<TmdbSeasonDetail | null> {
  return tmdb<TmdbSeasonDetail>(
    `/tv/${seriesId}/season/${seasonNumber}?append_to_response=credits,videos,images`
  );
}

export async function getTmdbEpisode(
  seriesId: number,
  seasonNumber: number,
  episodeNumber: number
): Promise<TmdbEpisodeDetail | null> {
  return tmdb<TmdbEpisodeDetail>(
    `/tv/${seriesId}/season/${seasonNumber}/episode/${episodeNumber}?append_to_response=images,videos`
  );
}

export async function getTmdbPerson(
  id: number
): Promise<TmdbPersonDetail | null> {
  return tmdb<TmdbPersonDetail>(
    `/person/${id}?append_to_response=combined_credits,images,external_ids`
  );
}

/* ───────────────────────── Auth (V3) ───────────────────────── */

export async function createTmdbRequestToken(): Promise<TmdbAuthTokenResponse | null> {
  return tmdb<TmdbAuthTokenResponse>(`/authentication/token/new`, {
    noStore: true,
  });
}

export async function validateTmdbRequestTokenWithLogin(
  username: string,
  password: string,
  requestToken: string
): Promise<TmdbAuthTokenResponse | null> {
  return tmdbRequest<TmdbAuthTokenResponse>(
    `/authentication/token/validate_with_login`,
    "POST",
    {
      username,
      password,
      request_token: requestToken,
    },
    { noStore: true }
  );
}

export async function createTmdbSession(
  requestToken: string
): Promise<TmdbSessionResponse | null> {
  return tmdbRequest<TmdbSessionResponse>(
    `/authentication/session/new`,
    "POST",
    { request_token: requestToken },
    { noStore: true }
  );
}

export async function getTmdbAccount(
  sessionId: string
): Promise<TmdbAccountDetails | null> {
  const encodedSessionId = encodeURIComponent(sessionId.trim());

  return tmdb<TmdbAccountDetails>(`/account?session_id=${encodedSessionId}`, {
    noStore: true,
  });
}

export async function loginTmdbSession(
  username: string,
  password: string
): Promise<TmdbLoginSessionResponse | null> {
  const token = await createTmdbRequestToken();

  if (!token?.request_token) {
    return null;
  }

  const validatedToken = await validateTmdbRequestTokenWithLogin(
    username,
    password,
    token.request_token
  );

  if (!validatedToken?.request_token) {
    return null;
  }

  const session = await createTmdbSession(validatedToken.request_token);

  if (!session?.session_id) {
    return null;
  }

  const account = await getTmdbAccount(session.session_id);

  return {
    session_id: session.session_id,
    account_id: account?.id,
  };
}

export async function getTmdbAccountWatchlist(
  accountId: string,
  mediaType: "movie" | "tv",
  sessionId: string,
  page = 1
): Promise<TmdbWatchlistDetail | null> {
  const normalizedAccountId = accountId.trim();
  const normalizedSessionId = sessionId.trim();
  const watchlistPathType = mediaType === "movie" ? "movies" : "tv";

  if (!normalizedAccountId || !normalizedSessionId) {
    return null;
  }

  const encodedSessionId = encodeURIComponent(normalizedSessionId);

  return tmdb<TmdbWatchlistDetail>(
    `/account/${encodeURIComponent(normalizedAccountId)}/watchlist/${watchlistPathType}?session_id=${encodedSessionId}&page=${page}`,
    { noStore: true }
  );
}

/* ───────────────────────── Ratings (V3) ───────────────────────── */

function ratingPath(mediaType: "movie" | "tv", mediaId: number) {
  return `/${mediaType}/${mediaId}/rating`;
}

function accountStatesPath(mediaType: "movie" | "tv", mediaId: number) {
  return `/${mediaType}/${mediaId}/account_states`;
}

export function extractTmdbUserRating(accountStates: TmdbAccountStates) {
  if (!accountStates.rated || typeof accountStates.rated === "boolean") {
    return null;
  }

  return typeof accountStates.rated.value === "number"
    ? accountStates.rated.value
    : null;
}

export async function getTmdbMediaAccountStates(
  mediaType: "movie" | "tv",
  mediaId: number,
  sessionId: string
): Promise<TmdbAccountStates | null> {
  return tmdb<TmdbAccountStates>(
    withSessionId(accountStatesPath(mediaType, mediaId), sessionId),
    { noStore: true }
  );
}

export async function rateTmdbMedia(
  mediaType: "movie" | "tv",
  mediaId: number,
  rating: number,
  sessionId: string
): Promise<TmdbApiStatusResponse | TmdbMutationError> {
  const result = await tmdbRequestDetailed<TmdbApiStatusResponse>(
    withSessionId(ratingPath(mediaType, mediaId), sessionId),
    "POST",
    { value: rating },
    { noStore: true }
  );

  if (result.ok) {
    return result.data;
  }

  return {
    status: result.status,
    message: result.message,
  };
}

export async function deleteTmdbMediaRating(
  mediaType: "movie" | "tv",
  mediaId: number,
  sessionId: string
): Promise<TmdbApiStatusResponse | TmdbMutationError> {
  const result = await tmdbRequestDetailed<TmdbApiStatusResponse>(
    withSessionId(ratingPath(mediaType, mediaId), sessionId),
    "DELETE",
    undefined,
    { noStore: true }
  );

  if (result.ok) {
    return result.data;
  }

  return {
    status: result.status,
    message: result.message,
  };
}

/* ───────────────────────── Lists (V4 ONLY) ───────────────────────── */

export interface TmdbV4ListResponse {
  success: boolean;
  status_code: number;
  status_message: string;
  id?: number;
  list_id?: number;
}

export type TmdbV4ListMutationError = {
  status: number;
  message: string;
};

export async function createTmdbList(
  name: string,
  description: string,
  sessionId: string,
  language = "en"
): Promise<TmdbV4ListResponse | null> {
  return tmdbRequestV4<TmdbV4ListResponse>(
    withSessionId(`/list`, sessionId),
    "POST",
    {
      name,
      description,
      iso_639_1: language,
      public: false,
    },
    { noStore: true }
  );
}

export async function createTmdbListDetailed(
  name: string,
  description: string,
  sessionId: string,
  language = "en"
): Promise<TmdbV4ListResponse | TmdbV4ListMutationError> {
  const result = await tmdbRequestV4Detailed<TmdbV4ListResponse>(
    withSessionId(`/list`, sessionId),
    "POST",
    {
      name,
      description,
      iso_639_1: language,
      public: false,
    },
    { noStore: true }
  );

  if (result.ok) {
    return result.data;
  }

  return {
    status: result.status,
    message: result.message,
  };
}

export async function addTmdbListItem(
  listId: number,
  mediaId: number,
  mediaType: "movie" | "tv",
  sessionId: string
): Promise<TmdbV4ListResponse | TmdbV4ListMutationError> {
  const result = await tmdbRequestV4Detailed<TmdbV4ListResponse>(
    withSessionId(`/list/${listId}/items`, sessionId),
    "POST",
    {
      items: [
        {
          media_type: mediaType,
          media_id: mediaId,
        },
      ],
    },
    { noStore: true }
  );

  if (result.ok) {
    return result.data;
  }

  return {
    status: result.status,
    message: result.message,
  };
}

export async function removeTmdbListItem(
  listId: number,
  mediaId: number,
  mediaType: "movie" | "tv",
  sessionId: string
): Promise<TmdbV4ListResponse | TmdbV4ListMutationError> {
  const result = await tmdbRequestV4Detailed<TmdbV4ListResponse>(
    withSessionId(`/list/${listId}/items`, sessionId),
    "DELETE",
    {
      items: [
        {
          media_type: mediaType,
          media_id: mediaId,
        },
      ],
    },
    { noStore: true }
  );

  if (result.ok) {
    return result.data;
  }

  return {
    status: result.status,
    message: result.message,
  };
}

export async function deleteTmdbList(
  listId: number,
  sessionId: string
): Promise<TmdbV4ListResponse | TmdbV4ListMutationError> {
  const result = await tmdbRequestV4Detailed<TmdbV4ListResponse>(
    withSessionId(`/list/${listId}`, sessionId),
    "DELETE",
    undefined,
    { noStore: true }
  );

  if (result.ok) {
    return result.data;
  }

  return {
    status: result.status,
    message: result.message,
  };
}

/* ───────────────────────── Faster List Fetch ───────────────────────── */

export async function getTmdbList(
  listId: number,
  sessionId?: string
): Promise<TmdbListDetail | null> {
  type TmdbV4ListPage = Omit<TmdbListDetail, "items"> & {
    items?: TmdbMediaResult[];
    results?: TmdbMediaResult[];
    page?: number;
    total_pages?: number;
  };

  function withPage(path: string, page: number) {
    const separator = path.includes("?") ? "&" : "?";
    return `${path}${separator}page=${page}`;
  }

  const basePath = withSessionId(`/list/${listId}`, sessionId);
  const firstPage = await tmdbRequestV4<TmdbV4ListPage>(
    withPage(basePath, 1),
    "GET",
    undefined,
    { noStore: true }
  );

  if (!firstPage) return null;

  const totalPages = Math.max(1, firstPage.total_pages ?? 1);
  const allItems: TmdbMediaResult[] = [...(firstPage.results ?? firstPage.items ?? [])];

  for (let page = 2; page <= totalPages; page += 1) {
    const nextPage = await tmdbRequestV4<TmdbV4ListPage>(
      withPage(basePath, page),
      "GET",
      undefined,
      { noStore: true }
    );

    if (!nextPage) {
      continue;
    }

    allItems.push(...(nextPage.results ?? nextPage.items ?? []));
  }

  const items = allItems.map((item) => ({
    ...item,
    media_type: item.media_type ?? "movie",
  }));

  return {
    id: firstPage.id,
    name: firstPage.name,
    description: firstPage.description,
    item_count: firstPage.item_count,
    iso_639_1: firstPage.iso_639_1,
    poster_path: firstPage.poster_path,
    items,
  };
}

/* ───────────────────────── Watchlist Mutations ───────────────────────── */

export async function updateTmdbWatchlist(
  accountId: string,
  sessionId: string,
  mediaType: "movie" | "tv",
  mediaId: number,
  add: boolean
): Promise<TmdbDetailedResult<TmdbApiStatusResponse>> {
  const normalizedAccountId = encodeURIComponent(accountId.trim());
  const encodedSessionId = encodeURIComponent(sessionId.trim());

  return tmdbRequestDetailed<TmdbApiStatusResponse>(
    `/account/${normalizedAccountId}/watchlist?session_id=${encodedSessionId}`,
    "POST",
    { media_type: mediaType, media_id: mediaId, watchlist: add },
    { noStore: true }
  );
}

/* ───────────────────────── Helpers ───────────────────────── */

export function parseTmdbInput(input: string): {
  type: "movie" | "tv" | "person" | null;
  id: number | null;
} {
  const urlMatch = input.match(/themoviedb\.org\/(movie|tv|person)\/(\d+)/);

  if (urlMatch) {
    return {
      type: urlMatch[1] as any,
      id: parseInt(urlMatch[2]),
    };
  }

  if (/^\d+$/.test(input)) {
    return {
      type: null,
      id: parseInt(input),
    };
  }

  return { type: null, id: null };
}