import type {
	TmdbMediaDetail as BaseTmdbMediaDetail,
	TmdbMediaResult as BaseTmdbMediaResult,
	TmdbPersonDetail as BaseTmdbPersonDetail,
} from "@/lib/tmdb"

export type TmdbMediaType = "movie" | "tv" | "person"

export type TmdbApiStatusResponse = {
	success: boolean
	status_code: number
	status_message: string
}

export type TmdbPagedResponse<TItem> = {
	page: number
	results: TItem[]
	total_pages: number
	total_results: number
}

export type TmdbMovieSummary = BaseTmdbMediaResult & {
	title: string
	original_title?: string
	release_date?: string
	media_type?: "movie"
}

export type TmdbTvSummary = BaseTmdbMediaResult & {
	name: string
	original_name?: string
	first_air_date?: string
	origin_country: string[]
	media_type?: "tv"
}

export type TmdbMovieDetails = BaseTmdbMediaDetail & {
	title: string
	original_title?: string
	release_date?: string
}

export type TmdbTvDetails = BaseTmdbMediaDetail & {
	name: string
	original_name?: string
	first_air_date?: string
	origin_country: string[]
}

export type TmdbPersonDetails = BaseTmdbPersonDetail

export type TmdbSearchMovieResult = TmdbMovieSummary & {
	media_type: "movie"
}

export type TmdbSearchTvResult = TmdbTvSummary & {
	media_type: "tv"
}

export type TmdbSearchPersonResult = BaseTmdbPersonDetail & {
	media_type: "person"
}

export type TmdbSearchResult =
	| TmdbSearchMovieResult
	| TmdbSearchTvResult
	| TmdbSearchPersonResult

export type TmdbSearchMediaPreview = {
	id: number
	title: string
	year: string
	poster: string | null
	type: "movie" | "tv"
}

export type TmdbSearchPersonPreview = {
	id: number
	name: string
	image: string | null
	type: "person"
	known: string
}

export type TmdbSearchPreview = TmdbSearchMediaPreview | TmdbSearchPersonPreview

export type TmdbNormalizedMedia = {
	title: string
	originalTitle: string
	tagline: string
	description: string
	year: number
	releaseDate: string
	country: string
	language: string
	poster: string
	backdrop: string
	runtime: number
	episodes?: number
	seasons?: number
	budget?: number
	boxOffice?: number
	tmdbId: number
	imdbId: string
	genres: string[]
	seriesStatus?: string
}

export type TmdbNormalizedPerson = {
	name: string
	bio: string
	birthDate: string
	deathDate: string
	birthCountry: string
	gender: string
	image: string
	tmdbId: number
	imdbId: string
	alsoKnownAs: string[]
}

export type TmdbMediaDetailPayload = {
	type: "movie" | "tv"
	detail: BaseTmdbMediaDetail
	normalized: TmdbNormalizedMedia
}

export type TmdbPersonDetailPayload = {
	type: "person"
	detail: BaseTmdbPersonDetail
	normalized: TmdbNormalizedPerson
}

export type TmdbRouteDetailPayload = TmdbMediaDetailPayload | TmdbPersonDetailPayload

export type TmdbCountry = {
	iso_3166_1: string
	english_name?: string
	native_name?: string
	name?: string
}

export type TmdbCreateListInput = {
	name: string
	description: string
	sessionId: string
	language?: string
}

export type TmdbListItemInput = {
	listId: number
	mediaId: number
	sessionId: string
}

export type TmdbDeleteListInput = {
	listId: number
	sessionId: string
}

export type TmdbSearchInput = {
	query: string
	page?: number
	language?: string
	includeAdult?: boolean
}

export type TmdbMediaDetailsInput = {
	mediaType: "movie" | "tv"
	mediaId: number
	language?: string
}

export type Movie = TmdbMovieSummary | TmdbMovieDetails
export type Series = TmdbTvSummary | TmdbTvDetails
export type Anime = TmdbTvSummary | TmdbTvDetails
export type Documentry = TmdbMovieSummary | TmdbMovieDetails
export type Documentary = TmdbMovieSummary | TmdbMovieDetails
