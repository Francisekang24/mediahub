import Image from "next/image"
import Link from "next/link"

import { profileUrl } from "@/lib/tmdb"

type PersonCreditCardProps = {
    personId: number
    name: string
    role: string
    department?: string
    profilePath?: string | null
}

function initials(name: string) {
    return name
        .split(" ")
        .map((part) => part[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
}

export default function PersonCreditCard({ personId, name, role, department, profilePath }: PersonCreditCardProps) {
    const imageUrl = profileUrl(profilePath ?? null, "w185")

    return (
        <Link href={`/person/${personId}`} className="flex items-center gap-3 rounded-2xl border border-border bg-muted/40 p-4 transition-colors hover:bg-muted/60">
            <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-full bg-muted ring-1 ring-border">
                {imageUrl ? (
                    <Image src={imageUrl} alt={name} fill sizes="56px" className="object-cover" />
                ) : (
                    <div className="flex h-full w-full items-center justify-center text-sm font-semibold text-muted-foreground">
                        {initials(name)}
                    </div>
                )}
            </div>

            <div className="min-w-0 space-y-1">
                <p className="truncate font-semibold">{name}</p>
                <p className="truncate text-sm text-muted-foreground">{role}</p>
                {department ? <p className="truncate text-xs uppercase tracking-wide text-muted-foreground/80">{department}</p> : null}
            </div>
        </Link>
    )
}