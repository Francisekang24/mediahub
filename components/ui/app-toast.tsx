"use client"

import * as React from "react"
import { CheckCircle2, CircleAlert, X } from "lucide-react"

import { cn } from "@/lib/utils"

type AppToastDetail = {
    title: string
    description?: string
    variant?: "success" | "error"
}

type AppToastRecord = AppToastDetail & {
    id: number
}

const APP_TOAST_EVENT = "mediahub:toast"

export function showAppToast(detail: AppToastDetail) {
    if (typeof window === "undefined") return

    window.dispatchEvent(
        new CustomEvent<AppToastDetail>(APP_TOAST_EVENT, {
            detail,
        })
    )
}

export default function AppToastHost() {
    const [toasts, setToasts] = React.useState<AppToastRecord[]>([])

    React.useEffect(() => {
        function onToast(event: Event) {
            const custom = event as CustomEvent<AppToastDetail>
            const detail = custom.detail

            if (!detail?.title) return

            const id = Date.now() + Math.floor(Math.random() * 1000)
            const nextToast: AppToastRecord = {
                id,
                title: detail.title,
                description: detail.description,
                variant: detail.variant ?? "success",
            }

            setToasts((prev) => [...prev, nextToast])

            window.setTimeout(() => {
                setToasts((prev) => prev.filter((toast) => toast.id !== id))
            }, 2800)
        }

        window.addEventListener(APP_TOAST_EVENT, onToast)

        return () => {
            window.removeEventListener(APP_TOAST_EVENT, onToast)
        }
    }, [])

    if (!toasts.length) return null

    return (
        <div className="pointer-events-none fixed right-4 bottom-4 z-100 flex w-[min(92vw,380px)] flex-col gap-2">
            {toasts.map((toast) => {
                const isError = toast.variant === "error"

                return (
                    <div
                        key={toast.id}
                        className={cn(
                            "pointer-events-auto rounded-xl border px-3 py-2 shadow-lg backdrop-blur",
                            isError
                                ? "border-red-400/40 bg-red-950/85 text-red-100"
                                : "border-emerald-400/40 bg-emerald-950/85 text-emerald-100"
                        )}
                        role="status"
                        aria-live="polite"
                    >
                        <div className="flex items-start gap-2">
                            {isError ? (
                                <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" />
                            ) : (
                                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                            )}
                            <div className="min-w-0 flex-1">
                                <p className="text-sm font-medium leading-5">{toast.title}</p>
                                {toast.description ? (
                                    <p className="mt-0.5 text-xs opacity-90">{toast.description}</p>
                                ) : null}
                            </div>
                            <button
                                type="button"
                                onClick={() => setToasts((prev) => prev.filter((item) => item.id !== toast.id))}
                                className="rounded p-0.5 opacity-75 transition hover:opacity-100"
                                aria-label="Dismiss notification"
                            >
                                <X className="h-3.5 w-3.5" />
                            </button>
                        </div>
                    </div>
                )
            })}
        </div>
    )
}
