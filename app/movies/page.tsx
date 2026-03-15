"use client"

import TmdbListManager from "@/components/tmdb-list-manager"

const DEFAULT_MOVIES_LIST_ID = 8639303

export default function MoviesPage() {
    return (
        <TmdbListManager
            pageTitle="Movies"
            pageDescription="Movies I've watched, or at least the ones I can remember."
            mediaType="movie"
            mediaKind="movie"
            defaultListId={DEFAULT_MOVIES_LIST_ID}
            listStorageKey="tmdb.movies.listId"
        />
    )
}