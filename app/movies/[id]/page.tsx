import { notFound } from "next/navigation"

import MediaDetailPage from "@/components/media-detail-page"
import { getTmdbMovie } from "@/lib/tmdb"

type MovieDetailPageProps = {
    params: Promise<{
        id: string
    }>
}

export default async function MovieDetailPage({ params }: MovieDetailPageProps) {
    const { id } = await params
    const movieId = Number.parseInt(id, 10)

    if (!Number.isFinite(movieId) || movieId <= 0) {
        notFound()
    }

    const detail = await getTmdbMovie(movieId)

    if (!detail) {
        notFound()
    }

    return <MediaDetailPage detail={detail} mediaType="movie" />
}