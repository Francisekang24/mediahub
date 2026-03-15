import { NextResponse } from "next/server";

import {
  addTmdbListItem,
  createTmdbRequestToken,
  createTmdbSession,
  createTmdbListDetailed,
  deleteTmdbMediaRating,
  deleteTmdbList,
  discoverTmdbMedia,
  extractTmdbUserRating,
  getTmdbAccount,
  getTmdbAccountWatchlist,
  getTmdbMediaAccountStates,
  getTrendingMedia,
  getTmdbMovie,
  getTmdbTv,
  getTmdbList,
  loginTmdbSession,
  searchTmdbMedia,
  removeTmdbListItem,
  rateTmdbMedia,
  updateTmdbWatchlist,
  parseTmdbInput,
  posterUrl,
} from "@/lib/tmdb";

/* ───────────────────────── Helpers ───────────────────────── */

function parsePositiveInt(value: string | null): number | null {
  if (!value) return null;

  const num = Number.parseInt(value, 10);

  if (!Number.isFinite(num) || num <= 0) return null;

  return num;
}

const NO_STORE_HEADERS = {
  "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
  Pragma: "no-cache",
  Expires: "0",
};

function mapMediaRow(item: {
  id: number;
  title?: string;
  name?: string;
  release_date?: string;
  first_air_date?: string;
  poster_path: string | null;
  media_type?: "movie" | "tv" | "person";
}) {
  const mediaType: "movie" | "tv" = item.media_type === "tv" ? "tv" : "movie";

  return {
    id: item.id,
    title: item.title ?? item.name ?? "",
    year: (item.release_date ?? item.first_air_date ?? "").split("-")[0],
    poster: posterUrl(item.poster_path),
    type: mediaType,
  };
}

/* ───────────────────────── GET ───────────────────────── */

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  const feature = searchParams.get("feature");
  const q = searchParams.get("q")?.trim() ?? "";
  const id = searchParams.get("id");
  const type = searchParams.get("type") as "movie" | "tv" | null;

  /* ───── Trending ───── */

  if (feature === "trending") {
    const mediaTypeParam = searchParams.get("mediaType") ?? "all";
    const timeWindowParam = searchParams.get("timeWindow") ?? "week";

    const page = parsePositiveInt(searchParams.get("page")) ?? 1;

    const mediaType =
      mediaTypeParam === "movie" || mediaTypeParam === "tv"
        ? mediaTypeParam
        : "all";

    const timeWindow = timeWindowParam === "day" ? "day" : "week";

    const data = await getTrendingMedia(mediaType, timeWindow, page);

    if (!data) {
      return NextResponse.json(
        { error: "Unable to load trending items." },
        { status: 502 }
      );
    }

    return NextResponse.json({
      ...data,
      results: data.results
        .filter((item) => item.media_type === "movie" || item.media_type === "tv")
        .map(mapMediaRow),
    });
  }

  /* ───── Discover ───── */

  if (feature === "discover") {
    const mediaType =
      (searchParams.get("mediaType") as "movie" | "tv" | null) ?? "movie";

    const page = parsePositiveInt(searchParams.get("page")) ?? 1;

    const data = await discoverTmdbMedia(mediaType, page);

    if (!data) {
      return NextResponse.json(
        { error: "Unable to load discovery results." },
        { status: 502 }
      );
    }

    return NextResponse.json({
      ...data,
      mediaType,
      results: data.results.map((item) =>
        mapMediaRow({ ...item, media_type: mediaType })
      ),
    });
  }

  /* ───── Auth ───── */

  if (feature === "auth") {
    const action = searchParams.get("action") ?? "";

    if (action === "request-token") {
      const token = await createTmdbRequestToken();

      if (!token) {
        return NextResponse.json(
          { error: "Unable to create request token." },
          { status: 502 }
        );
      }

      return NextResponse.json({
        ...token,
        authenticate_url: `https://www.themoviedb.org/authenticate/${token.request_token}`,
      });
    }

    if (action === "account") {
      const sessionId = searchParams.get("sessionId")?.trim() ?? "";

      if (!sessionId) {
        return NextResponse.json(
          { error: "sessionId is required." },
          { status: 400 }
        );
      }

      const account = await getTmdbAccount(sessionId);

      if (!account) {
        return NextResponse.json(
          { error: "Unable to load account." },
          { status: 502 }
        );
      }

      return NextResponse.json(account, { headers: NO_STORE_HEADERS });
    }

    return NextResponse.json(
      { error: "Unsupported auth action." },
      { status: 400 }
    );
  }

  /* ───── Lists ───── */

  if (feature === "lists") {
    const listId = parsePositiveInt(searchParams.get("listId"));
    const sessionId = searchParams.get("sessionId")?.trim() ?? "";

    if (!listId) {
      return NextResponse.json(
        { error: "listId is required." },
        { status: 400 }
      );
    }

    const detail = await getTmdbList(listId, sessionId || undefined);

    if (!detail) {
      return NextResponse.json(
        { error: "Unable to load list." },
        { status: 502 }
      );
    }

    return NextResponse.json(
      {
        ...detail,
        results: detail.items.map(mapMediaRow),
      },
      { headers: NO_STORE_HEADERS }
    );
  }

  /* ───── Watchlist ───── */

  if (feature === "watchlist") {
    const accountId = searchParams.get("accountId")?.trim() ?? "";
    const sessionId = searchParams.get("sessionId")?.trim() ?? "";
    const mediaType = searchParams.get("mediaType") === "tv" ? "tv" : "movie";
    const page = parsePositiveInt(searchParams.get("page")) ?? 1;

    if (!accountId) {
      return NextResponse.json(
        { error: "accountId is required." },
        { status: 400 }
      );
    }

    if (!sessionId) {
      return NextResponse.json(
        { error: "sessionId is required." },
        { status: 400 }
      );
    }

    const data = await getTmdbAccountWatchlist(
      accountId,
      mediaType,
      sessionId,
      page
    );

    if (!data) {
      return NextResponse.json(
        { error: "Unable to load watchlist." },
        { status: 502 }
      );
    }

    return NextResponse.json(
      {
        ...data,
        mediaType,
        results: (data.results ?? []).map((item) =>
          mapMediaRow({ ...item, media_type: mediaType })
        ),
      },
      { headers: NO_STORE_HEADERS }
    );
  }

  /* ───── Ratings ───── */

  if (feature === "rating") {
    const mediaId = parsePositiveInt(searchParams.get("mediaId"));
    const sessionId = searchParams.get("sessionId")?.trim() ?? "";
    const mediaType = searchParams.get("mediaType") === "tv" ? "tv" : "movie";

    if (!mediaId) {
      return NextResponse.json(
        { error: "mediaId is required." },
        { status: 400 }
      );
    }

    if (!sessionId) {
      return NextResponse.json(
        { error: "sessionId is required." },
        { status: 400 }
      );
    }

    const accountStates = await getTmdbMediaAccountStates(
      mediaType,
      mediaId,
      sessionId
    );

    if (!accountStates) {
      return NextResponse.json(
        { error: "Unable to load your TMDB rating." },
        { status: 502 }
      );
    }

    return NextResponse.json(
      {
        rated: extractTmdbUserRating(accountStates),
        watchlist: accountStates.watchlist === true,
      },
      { headers: NO_STORE_HEADERS }
    );
  }

  /* ───── Fetch by ID ───── */

  if (id) {
    const numId = parseInt(id);

    const mediaType = type ?? "movie";

    const detail =
      mediaType === "tv"
        ? await getTmdbTv(numId)
        : await getTmdbMovie(numId);

    if (!detail) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json(detail);
  }

  /* ───── Parse direct URL / ID ───── */

  if (q) {
    const parsed = parseTmdbInput(q);

    if (parsed.id) {
      const detail =
        parsed.type === "tv"
          ? await getTmdbTv(parsed.id)
          : await getTmdbMovie(parsed.id);

      if (detail) {
        const title = detail.title ?? detail.name ?? "";

        const year = (detail.release_date ?? detail.first_air_date ?? "").split("-")[0];

        return NextResponse.json([
          {
            id: detail.id,
            title,
            year,
            poster: posterUrl(detail.poster_path),
            type: parsed.type ?? "movie",
          },
        ]);
      }
    }
  }

  /* ───── Search ───── */

  if (!q || q.length < 2) {
    return NextResponse.json([]);
  }

  const results = await searchTmdbMedia(q);

  return NextResponse.json(
    results.map((r) => ({
      id: r.id,
      title: r.title ?? r.name,
      year: (r.release_date ?? r.first_air_date ?? "").split("-")[0],
      poster: posterUrl(r.poster_path),
      type: r.media_type,
    }))
  );
}

/* ───────────────────────── POST ───────────────────────── */

export async function POST(req: Request) {
  const { searchParams } = new URL(req.url);

  const feature = searchParams.get("feature");

  const body = await req.json().catch(() => ({}));

  /* ───── Lists ───── */

  if (feature === "auth") {
    const action = typeof body.action === "string" ? body.action : "";

    if (action === "login-session") {
      const username = typeof body.username === "string" ? body.username.trim() : "";
      const password = typeof body.password === "string" ? body.password : "";

      if (!username || !password) {
        return NextResponse.json(
          { error: "username and password are required." },
          { status: 400 }
        );
      }

      const session = await loginTmdbSession(username, password);

      if (!session) {
        return NextResponse.json(
          { error: "Unable to sign in with TMDB." },
          { status: 502 }
        );
      }

      return NextResponse.json(session);
    }

    if (action === "create-session") {
      const requestToken =
        typeof body.requestToken === "string" ? body.requestToken.trim() : "";

      if (!requestToken) {
        return NextResponse.json(
          { error: "requestToken is required." },
          { status: 400 }
        );
      }

      const session = await createTmdbSession(requestToken);

      if (!session) {
        return NextResponse.json(
          { error: "Unable to create session id." },
          { status: 502 }
        );
      }

      return NextResponse.json(session);
    }

    return NextResponse.json(
      { error: "Unsupported auth action." },
      { status: 400 }
    );
  }

  if (feature === "lists") {
    const action = typeof body.action === "string" ? body.action : "";

    if (action === "create") {
      const name = typeof body.name === "string" ? body.name.trim() : "";
      const description =
        typeof body.description === "string" ? body.description : "";
      const sessionId =
        typeof body.sessionId === "string" ? body.sessionId.trim() : "";

      if (!name) {
        return NextResponse.json(
          { error: "List name is required." },
          { status: 400 }
        );
      }

      if (!sessionId) {
        return NextResponse.json(
          { error: "sessionId is required for TMDB v4 list creation." },
          { status: 400 }
        );
      }

      const result = await createTmdbListDetailed(name, description, sessionId);

      if (!("success" in result)) {
        return NextResponse.json(
          {
            error:
              result.status > 0
                ? `Unable to create list. TMDB v4 ${result.status}: ${result.message}`
                : `Unable to create list. ${result.message}`,
          },
          { status: result.status >= 400 ? result.status : 502 }
        );
      }

      return NextResponse.json(result);
    }

    if (action === "add" || action === "remove") {
      const listId = Number.parseInt(String(body.listId ?? ""), 10);
      const mediaId = Number.parseInt(String(body.mediaId ?? ""), 10);
      const sessionId =
        typeof body.sessionId === "string" ? body.sessionId.trim() : "";

      const mediaType =
        body.mediaType === "tv" ? "tv" : "movie";

      if (
        !Number.isFinite(listId) ||
        listId <= 0 ||
        !Number.isFinite(mediaId) ||
        mediaId <= 0
      ) {
        return NextResponse.json(
          { error: "listId and mediaId are required." },
          { status: 400 }
        );
      }

      if (!sessionId) {
        return NextResponse.json(
          { error: `sessionId is required to ${action} TMDB v4 list items.` },
          { status: 400 }
        );
      }

      const result =
        action === "add"
          ? await addTmdbListItem(listId, mediaId, mediaType, sessionId)
          : await removeTmdbListItem(listId, mediaId, mediaType, sessionId);

      if (!("success" in result)) {
        return NextResponse.json(
          {
            error:
              result.status > 0
                ? `Unable to ${action} list item. TMDB v4 ${result.status}: ${result.message}`
                : `Unable to ${action} list item. ${result.message}`,
          },
          { status: result.status >= 400 ? result.status : 502 }
        );
      }

      return NextResponse.json(result);
    }

    return NextResponse.json(
      { error: "Unsupported lists action." },
      { status: 400 }
    );
  }

  if (feature === "rating") {
    const action = typeof body.action === "string" ? body.action : "set";
    const mediaId = Number.parseInt(String(body.mediaId ?? ""), 10);
    const sessionId =
      typeof body.sessionId === "string" ? body.sessionId.trim() : "";
    const mediaType = body.mediaType === "tv" ? "tv" : "movie";
    const rating = Number.parseFloat(String(body.rating ?? ""));

    if (!Number.isFinite(mediaId) || mediaId <= 0) {
      return NextResponse.json(
        { error: "mediaId is required." },
        { status: 400 }
      );
    }

    if (!sessionId) {
      return NextResponse.json(
        { error: "sessionId is required to rate TMDB titles." },
        { status: 400 }
      );
    }

    if (action === "clear") {
      const result = await deleteTmdbMediaRating(mediaType, mediaId, sessionId);

      if (!("success" in result)) {
        return NextResponse.json(
          {
            error:
              result.status > 0
                ? `Unable to clear rating. TMDB ${result.status}: ${result.message}`
                : `Unable to clear rating. ${result.message}`,
          },
          { status: result.status >= 400 ? result.status : 502 }
        );
      }

      return NextResponse.json(result);
    }

    if (!Number.isFinite(rating) || rating < 0.5 || rating > 10) {
      return NextResponse.json(
        { error: "rating must be between 0.5 and 10." },
        { status: 400 }
      );
    }

    const normalizedRating = Math.round(rating * 2) / 2;

    const result = await rateTmdbMedia(
      mediaType,
      mediaId,
      normalizedRating,
      sessionId
    );

    if (!("success" in result)) {
      return NextResponse.json(
        {
          error:
            result.status > 0
              ? `Unable to save rating. TMDB ${result.status}: ${result.message}`
              : `Unable to save rating. ${result.message}`,
        },
        { status: result.status >= 400 ? result.status : 502 }
      );
    }

    return NextResponse.json(result);
  }

  /* ───── Watchlist mutations ───── */

  if (feature === "watchlist") {
    const accountId =
      typeof body.accountId === "string" ? body.accountId.trim() : "";
    const sessionId =
      typeof body.sessionId === "string" ? body.sessionId.trim() : "";
    const mediaType = body.mediaType === "tv" ? "tv" : "movie";
    const mediaId = Number.parseInt(String(body.mediaId ?? ""), 10);
    const remove = body.remove === true;

    if (!accountId || !sessionId) {
      return NextResponse.json(
        { error: "accountId and sessionId are required." },
        { status: 400 }
      );
    }

    if (!Number.isFinite(mediaId) || mediaId <= 0) {
      return NextResponse.json(
        { error: "mediaId is required." },
        { status: 400 }
      );
    }

    const result = await updateTmdbWatchlist(
      accountId,
      sessionId,
      mediaType,
      mediaId,
      !remove
    );

    if (!result.ok) {
      return NextResponse.json(
        {
          error:
            result.status > 0
              ? `Unable to update watchlist. TMDB ${result.status}: ${result.message}`
              : `Unable to update watchlist. ${result.message}`,
        },
        { status: result.status >= 400 ? result.status : 502 }
      );
    }

    return NextResponse.json(result.data);
  }

  return NextResponse.json(
    { error: "Unsupported feature." },
    { status: 400 }
  );
}

/* ───────────────────────── DELETE ───────────────────────── */

export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url);

  const feature = searchParams.get("feature");

  if (feature !== "lists") {
    if (feature === "rating") {
      const mediaId = parsePositiveInt(searchParams.get("mediaId"));
      const sessionId = searchParams.get("sessionId")?.trim() ?? "";
      const mediaType = searchParams.get("mediaType") === "tv" ? "tv" : "movie";

      if (!mediaId) {
        return NextResponse.json(
          { error: "mediaId is required." },
          { status: 400 }
        );
      }

      if (!sessionId) {
        return NextResponse.json(
          { error: "sessionId is required to clear a TMDB rating." },
          { status: 400 }
        );
      }

      const result = await deleteTmdbMediaRating(mediaType, mediaId, sessionId);

      if (!("success" in result)) {
        return NextResponse.json(
          {
            error:
              result.status > 0
                ? `Unable to clear rating. TMDB ${result.status}: ${result.message}`
                : `Unable to clear rating. ${result.message}`,
          },
          { status: result.status >= 400 ? result.status : 502 }
        );
      }

      return NextResponse.json(result);
    }

    return NextResponse.json(
      { error: "Unsupported feature." },
      { status: 400 }
    );
  }

  const listId = parsePositiveInt(searchParams.get("listId"));
  const sessionId = searchParams.get("sessionId")?.trim() ?? "";

  if (!listId) {
    return NextResponse.json(
      { error: "listId is required." },
      { status: 400 }
    );
  }

  if (!sessionId) {
    return NextResponse.json(
      { error: "sessionId is required for TMDB v4 list deletion." },
      { status: 400 }
    );
  }

  const result = await deleteTmdbList(listId, sessionId);

  if (!("success" in result)) {
    return NextResponse.json(
      {
        error:
          result.status > 0
            ? `Unable to delete list. TMDB v4 ${result.status}: ${result.message}`
            : `Unable to delete list. ${result.message}`,
      },
      { status: result.status >= 400 ? result.status : 502 }
    );
  }

  return NextResponse.json(result);
}