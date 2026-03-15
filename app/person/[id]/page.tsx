import { notFound } from "next/navigation"

import PersonDetailPage from "@/components/person-detail-page"
import { getTmdbPerson } from "@/lib/tmdb"

type PersonPageProps = {
    params: Promise<{
        id: string
    }>
}

export default async function PersonPage({ params }: PersonPageProps) {
    const { id } = await params
    const personId = Number.parseInt(id, 10)

    if (!Number.isFinite(personId) || personId <= 0) {
        notFound()
    }

    const detail = await getTmdbPerson(personId)

    if (!detail) {
        notFound()
    }

    return <PersonDetailPage detail={detail} />
}