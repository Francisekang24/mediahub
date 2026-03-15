"use client"

import TmdbListManager from "@/components/tmdb-list-manager"

const DEFAULT_SERIES_LIST_ID = 8639312

export default function SeriesPage() {
    return (
        <TmdbListManager
            pageTitle="Series"
            pageDescription="Series I've watched, or at least the ones I can remember."
            mediaType="tv"
            mediaKind="series"
            defaultListId={DEFAULT_SERIES_LIST_ID}
            listStorageKey="tmdb.series.listId"
        />
    )
}