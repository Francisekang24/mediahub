"use client"

import * as React from "react"
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react"

import MediaCardMd from "@/components/media-card-md"
import WatchlistButton from "@/components/watchlist-button"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { Anime, Documentary, Movie, Series } from "@/lib/types"

type MediaKind = "movie" | "series" | "anime" | "documentary"

type FeatureItem = {
    id: number
    title: string
    year: string
    poster: string | null
    type: "movie" | "tv"
	href?: string
}	

type MediaRowProps = {
	title: string
	items: FeatureItem[]
	className?: string
	showWatchlistButton?: boolean
}

export default function MediaRow({ title, items, className, showWatchlistButton }: MediaRowProps) {
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
	}, [updateScrollState])

	const scrollByPage = (direction: "left" | "right") => {
		const node = scrollRef.current
		if (!node) return

		const amount = Math.round(node.clientWidth * 0.9)
		node.scrollBy({
			left: direction === "left" ? -amount : amount,
			behavior: "smooth",
		})
	}

	return (
		<section className={cn("w-full space-y-4", className)}>
			<div className="flex items-center justify-between gap-3">
				<h2 className="text-xl font-semibold md:text-2xl">{title}</h2>

				<div className="flex items-center gap-2">
					<Button
						type="button"
						variant="outline"
						size="icon-sm"
						onClick={() => scrollByPage("left")}
						disabled={!canScrollLeft}
						aria-label={`Scroll ${title} left`}
					>
						<ChevronLeftIcon />
					</Button>
					<Button
						type="button"
						variant="outline"
						size="icon-sm"
						onClick={() => scrollByPage("right")}
						disabled={!canScrollRight}
						aria-label={`Scroll ${title} right`}
					>
						<ChevronRightIcon />
					</Button>
				</div>
			</div>

			<div
				ref={scrollRef}
				className="overflow-x-auto scroll-smooth [&::-webkit-scrollbar]:hidden"
				style={{
					scrollbarWidth: "none",
					msOverflowStyle: "none",
				}}
				onWheel={(event) => {
					event.preventDefault()
				}}
			>
				<div className="flex gap-4 pb-1">
					{items.map((item) => (
						<div key={item.id} className="shrink-0 space-y-2">
							<MediaCardMd
								media={item}
								kind={item.type === "movie" ? "movie" : "series"}
								href={item.href}
							/>
							{showWatchlistButton ? (
								<WatchlistButton
									mediaId={item.id}
									mediaType={item.type}
									className="w-full"
									size="sm"
								/>
							) : null}
						</div>
					))}
				</div>
			</div>
		</section>
	)
}
