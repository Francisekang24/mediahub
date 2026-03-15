import { notFound } from "next/navigation"

import MediaDetailPage from "@/components/media-detail-page"
import { getTmdbTv } from "@/lib/tmdb"

type SeriesDetailPageProps = {
    params: Promise<{
        id: string
    }>
}

export default async function SeriesDetailPage({ params }: SeriesDetailPageProps) {
    const { id } = await params
    const seriesId = Number.parseInt(id, 10)

    if (!Number.isFinite(seriesId) || seriesId <= 0) {
        notFound()
    }

    const detail = await getTmdbTv(seriesId)

    if (!detail) {
        notFound()
    }

    return <MediaDetailPage detail={detail} mediaType="tv" />
}