"use client"

import * as React from "react"
import Link from "next/link"
import { ChevronLeft, ChevronRight, ExternalLink, Play } from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export type DetailCarouselItem = {
    id: string
    title: string
    subtitle?: string
    imageUrl?: string | null
    href?: string
    externalHref?: string
    badge?: string
}

type DetailCarouselProps = {
    title: string
    items: DetailCarouselItem[]
    emptyText: string
    aspect?: "video" | "poster" | "wide"
    itemSize?: "xs" | "sm" | "md"
    externalIndicator?: "play" | "external" | "none"
    className?: string
}

function aspectClass(aspect: DetailCarouselProps["aspect"]) {
    if (aspect === "poster") return "aspect-[2/3]"
    if (aspect === "wide") return "aspect-[16/7]"
    return "aspect-video"
}

function widthClass(itemSize: DetailCarouselProps["itemSize"]) {
    if (itemSize === "xs") return "w-18 md:w-20"
    if (itemSize === "sm") return "w-28 md:w-32"
    return "w-72 md:w-80"
}

function CardBody({
    item,
    aspect = "video",
    itemSize = "md",
    externalIndicator = "external",
}: {
    item: DetailCarouselItem
    aspect?: DetailCarouselProps["aspect"]
    itemSize?: DetailCarouselProps["itemSize"]
    externalIndicator?: DetailCarouselProps["externalIndicator"]
}) {
    return (
        <article className={cn("group flex shrink-0 flex-col overflow-hidden rounded-2xl border border-border bg-card text-left shadow-sm transition-transform hover:-translate-y-0.5", widthClass(itemSize))}>
            <div
                className={cn(
                    "relative overflow-hidden bg-muted bg-cover bg-center",
                    aspectClass(aspect)
                )}
                style={item.imageUrl ? { backgroundImage: `url(${item.imageUrl})` } : undefined}
            >
                <div className="absolute inset-0 bg-linear-to-t from-black/70 via-black/10 to-black/10" />
                {item.externalHref && externalIndicator === "play" ? (
                    <div className="absolute right-3 bottom-3 inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur-sm">
                        <Play className="h-4 w-4 fill-current" />
                    </div>
                ) : null}
                {item.badge ? (
                    <span className="absolute top-3 left-3 rounded-full bg-black/55 px-2.5 py-1 text-xs font-medium text-white backdrop-blur-sm">
                        {item.badge}
                    </span>
                ) : null}
            </div>

            <div className={cn("space-y-1", itemSize === "xs" ? "p-2.5" : itemSize === "sm" ? "p-3" : "p-4")}>
                <div className="flex items-start justify-between gap-3">
                    <h3 className={cn("line-clamp-2 font-semibold leading-tight", itemSize === "xs" ? "text-xs md:text-sm" : itemSize === "sm" ? "text-sm" : "text-sm md:text-base")}>{item.title}</h3>
                    {item.externalHref && externalIndicator === "external" ? <ExternalLink className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" /> : null}
                </div>
                {item.subtitle ? <p className={cn("line-clamp-2 text-muted-foreground", itemSize === "xs" ? "text-[11px]" : itemSize === "sm" ? "text-xs" : "text-sm")}>{item.subtitle}</p> : null}
            </div>
        </article>
    )
}

export default function DetailCarousel({
    title,
    items,
    emptyText,
    aspect = "video",
    itemSize = "md",
    externalIndicator = "external",
    className,
}: DetailCarouselProps) {
    const scrollRef = React.useRef<HTMLDivElement | null>(null)
    const [canScrollLeft, setCanScrollLeft] = React.useState(false)
    const [canScrollRight, setCanScrollRight] = React.useState(false)

    const updateScrollState = React.useCallback(() => {
        const node = scrollRef.current
        if (!node) return

        const maxScrollLeft = node.scrollWidth - node.clientWidth
        setCanScrollLeft(node.scrollLeft > 0)
        setCanScrollRight(node.scrollLeft < maxScrollLeft - 1)
    }, [])

    React.useEffect(() => {
        const node = scrollRef.current
        if (!node) return

        updateScrollState()

        const onScroll = () => updateScrollState()
        const onResize = () => updateScrollState()

        node.addEventListener("scroll", onScroll)
        window.addEventListener("resize", onResize)

        return () => {
            node.removeEventListener("scroll", onScroll)
            window.removeEventListener("resize", onResize)
        }
    }, [items, updateScrollState])

    function scrollByPage(direction: "left" | "right") {
        const node = scrollRef.current
        if (!node) return

        node.scrollBy({
            left: direction === "left" ? -node.clientWidth * 0.9 : node.clientWidth * 0.9,
            behavior: "smooth",
        })
    }

    return (
        <section className={cn("space-y-4", className)}>
            <div className="flex items-center justify-between gap-3">
                <h2 className="text-2xl font-semibold tracking-tight">{title}</h2>
                <div className="flex gap-2">
                    <Button type="button" variant="outline" size="icon-sm" onClick={() => scrollByPage("left")} disabled={!canScrollLeft}>
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button type="button" variant="outline" size="icon-sm" onClick={() => scrollByPage("right")} disabled={!canScrollRight}>
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {!items.length ? (
                <p className="rounded-2xl border border-dashed border-border px-4 py-6 text-sm text-muted-foreground">{emptyText}</p>
            ) : (
                <div ref={scrollRef} className="overflow-x-auto scroll-smooth pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                    <div className="flex gap-4">
                        {items.map((item) => {
                            const content = <CardBody item={item} aspect={aspect} itemSize={itemSize} externalIndicator={externalIndicator} />

                            if (item.href) {
                                return (
                                    <Link key={item.id} href={item.href} className="rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                                        {content}
                                    </Link>
                                )
                            }

                            if (item.externalHref) {
                                return (
                                    <a key={item.id} href={item.externalHref} target="_blank" rel="noreferrer" className="rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                                        {content}
                                    </a>
                                )
                            }

                            return <div key={item.id}>{content}</div>
                        })}
                    </div>
                </div>
            )}
        </section>
    )
}