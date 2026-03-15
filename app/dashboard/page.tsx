"use client"

import * as React from "react"

import { useTmdbAuth } from "@/components/tmdb-auth-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"

type AccountList = {
    id: number
    name: string
    description: string
    item_count: number
}

const DASHBOARD_LIST_IDS_KEY = "tmdb.dashboard.v4ListIds"
const DEFAULT_DASHBOARD_LIST_IDS = [8639303, 8639312]

function parseSavedListIds(value: string | null) {
    if (!value) return [] as number[]

    try {
        const parsed = JSON.parse(value) as unknown
        if (!Array.isArray(parsed)) return []

        return parsed
            .map((entry) => Number.parseInt(String(entry), 10))
            .filter((entry) => Number.isFinite(entry) && entry > 0)
    } catch {
        return []
    }
}

function appendUniqueListId(existing: number[], nextId: number) {
    if (existing.includes(nextId)) return existing
    return [nextId, ...existing]
}

type ListItemPreview = {
    id: number
    title: string
    year: string
    type: "movie" | "tv"
}

export default function Dashboard() {
    const { accountId, sessionId, setAccountId, setSessionId, clearCredentials, isHydrated } = useTmdbAuth()
    const [tmdbUsername, setTmdbUsername] = React.useState("")
    const [tmdbPassword, setTmdbPassword] = React.useState("")
    const [requestToken, setRequestToken] = React.useState("")
    const [generatedRequestToken, setGeneratedRequestToken] = React.useState("")
    const [tokenExpiresAt, setTokenExpiresAt] = React.useState("")
    const [authenticateUrl, setAuthenticateUrl] = React.useState("")
    const [lists, setLists] = React.useState<AccountList[]>([])
    const [selectedListId, setSelectedListId] = React.useState<number | null>(null)
    const [selectedListItems, setSelectedListItems] = React.useState<ListItemPreview[]>([])
    const [newListName, setNewListName] = React.useState("")
    const [newListDescription, setNewListDescription] = React.useState("")
    const [savedListIdInput, setSavedListIdInput] = React.useState("")
    const [savedListIds, setSavedListIds] = React.useState<number[]>([])
    const [mediaIdInput, setMediaIdInput] = React.useState("")
    const [mediaTypeInput, setMediaTypeInput] = React.useState<"movie" | "tv">("movie")
    const [error, setError] = React.useState<string | null>(null)
    const [status, setStatus] = React.useState<string | null>(null)
    const [isLoadingLists, setIsLoadingLists] = React.useState(false)
    const [isLoadingDetail, setIsLoadingDetail] = React.useState(false)
    const [isCreatingToken, setIsCreatingToken] = React.useState(false)
    const [isCreatingSession, setIsCreatingSession] = React.useState(false)
    const [isSigningIn, setIsSigningIn] = React.useState(false)
    const [showAdvancedAuth, setShowAdvancedAuth] = React.useState(false)

    function buildListUrl(listId: number) {
        const params = new URLSearchParams({ feature: "lists", listId: String(listId) })

        if (sessionId.trim()) {
            params.set("sessionId", sessionId.trim())
        }

        return `/api/tmdb?${params.toString()}`
    }

    React.useEffect(() => {
        if (!isHydrated) return

        const storedListIds = parseSavedListIds(window.localStorage.getItem(DASHBOARD_LIST_IDS_KEY))

        setSavedListIds(
            storedListIds.length ? storedListIds : DEFAULT_DASHBOARD_LIST_IDS
        )
    }, [isHydrated])

    React.useEffect(() => {
        if (!isHydrated) return
        window.localStorage.setItem(DASHBOARD_LIST_IDS_KEY, JSON.stringify(savedListIds))
    }, [isHydrated, savedListIds])

    function parseTmdbDate(value: string) {
        if (!value) return NaN
        const normalized = value.replace(" UTC", "Z")
        return new Date(normalized).getTime()
    }

    async function signInWithTmdb() {
        if (!tmdbUsername.trim() || !tmdbPassword) {
            setError("TMDB username and password are required.")
            return
        }

        setIsSigningIn(true)
        setError(null)
        setStatus(null)

        const response = await fetch("/api/tmdb?feature=auth", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                action: "login-session",
                username: tmdbUsername.trim(),
                password: tmdbPassword,
            }),
        })
        const payload = await response.json()
        setIsSigningIn(false)

        if (!response.ok) {
            setError(payload.error ?? "Unable to sign in with TMDB.")
            return
        }

        const nextSessionId = payload.session_id ?? ""
        setSessionId(nextSessionId)

        if (payload.account_id) {
            setAccountId(String(payload.account_id))
            setStatus("Signed in with TMDB. Global account and session are ready.")
        } else {
            setStatus("Signed in with TMDB. Session created; account id was not returned.")
        }

        setTmdbPassword("")
    }

    async function createRequestToken() {
        setIsCreatingToken(true)
        setError(null)
        setStatus(null)

        const response = await fetch(`/api/tmdb?feature=auth&action=request-token&t=${Date.now()}`, {
            cache: "no-store",
        })
        const payload = await response.json()

        setIsCreatingToken(false)

        if (!response.ok) {
            setError(payload.error ?? "Unable to create request token.")
            return
        }

        setGeneratedRequestToken(payload.request_token ?? "")
        setTokenExpiresAt(payload.expires_at ?? "")
        setAuthenticateUrl(payload.authenticate_url ?? "")
        setRequestToken(payload.request_token ?? "")
        if (payload.authenticate_url) {
            window.open(payload.authenticate_url, "_blank", "noopener,noreferrer")
        }
        setStatus("Request token created and approval page opened. Approve, then click Create Session ID.")
    }

    async function createSession() {
        const token = requestToken.trim()
        if (!token) {
            setError("Request token is required.")
            return
        }

        const expiresAtTime = parseTmdbDate(tokenExpiresAt)
        if (Number.isFinite(expiresAtTime) && expiresAtTime <= Date.now()) {
            setError("Request token expired. Create a new token and approve it again.")
            return
        }

        setIsCreatingSession(true)
        setError(null)
        setStatus(null)

        const response = await fetch("/api/tmdb?feature=auth", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                action: "create-session",
                requestToken: token,
            }),
        })
        const payload = await response.json()

        setIsCreatingSession(false)

        if (!response.ok) {
            setError(payload.error ?? "Unable to create session id. Ensure token was freshly created and approved.")
            return
        }

        const nextSessionId = payload.session_id ?? ""
        setSessionId(nextSessionId)

        const accountResponse = await fetch(`/api/tmdb?feature=auth&action=account&sessionId=${encodeURIComponent(nextSessionId)}`)
        const accountPayload = await accountResponse.json()

        if (accountResponse.ok && accountPayload.id) {
            setAccountId(String(accountPayload.id))
            setStatus(`Session id created. Account id ${accountPayload.id} was resolved and applied.`)
            return
        }

        setStatus("Session id created and applied. Enter account id if it was not auto-resolved.")
    }

    async function fetchLists() {
        setIsLoadingLists(true)
        setError(null)
        setStatus(null)

        if (!savedListIds.length) {
            setLists([])
            setIsLoadingLists(false)
            setStatus("No saved v4 lists yet. Create one or add an existing list id.")
            return
        }

        const responses = await Promise.all(
            savedListIds.map(async (listId) => {
                const responseWithSession = await fetch(buildListUrl(listId), {
                    cache: "no-store",
                })
                const payload = await responseWithSession.json()

                if (!responseWithSession.ok) {
                    return {
                        ok: false as const,
                        listId,
                        error: payload.error ?? "Unable to load list.",
                    }
                }

                return {
                    ok: true as const,
                    list: {
                        id: payload.id,
                        name: payload.name,
                        description: payload.description ?? "",
                        item_count: payload.item_count ?? (payload.results ?? []).length,
                    } satisfies AccountList,
                }
            })
        )

        setIsLoadingLists(false)

        const nextLists = responses.filter((entry) => entry.ok).map((entry) => entry.list)
        const failures = responses.filter((entry) => !entry.ok)

        setLists(nextLists)

        if (failures.length) {
            setError(`Some saved lists could not be loaded: ${failures.map((entry) => entry.listId).join(", ")}.`)
        } else {
            setStatus("V4 lists loaded.")
        }
    }

    React.useEffect(() => {
        if (!isHydrated) {
            return
        }

        void fetchLists()
    }, [isHydrated, savedListIds, sessionId])

    function addSavedListId() {
        const parsedListId = Number.parseInt(savedListIdInput.trim(), 10)

        if (!Number.isFinite(parsedListId) || parsedListId <= 0) {
            setError("Enter a valid TMDB v4 list id.")
            return
        }

        setError(null)
        setSavedListIds((current) => appendUniqueListId(current, parsedListId))
        setSavedListIdInput("")
        setStatus(`Saved list ${parsedListId}.`)
    }

    async function fetchListDetail(listId: number) {
        setSelectedListId(listId)
        setIsLoadingDetail(true)
        setError(null)

        const response = await fetch(buildListUrl(listId))
        const payload = await response.json()

        setIsLoadingDetail(false)

        if (!response.ok) {
            setError(payload.error ?? "Unable to load list detail.")
            return
        }

        setSelectedListItems(payload.results ?? [])
    }

    async function createList() {
        if (!newListName.trim()) {
            setError("List name is required.")
            return
        }

        if (!sessionId.trim()) {
            setError("Create a TMDB session first. V4 list writes require a user session id.")
            return
        }

        setError(null)
        const response = await fetch(`/api/tmdb?feature=lists`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                action: "create",
                sessionId,
                name: newListName.trim(),
                description: newListDescription,
            }),
        })
        const payload = await response.json()

        if (!response.ok) {
            setError(payload.error ?? "Unable to create list.")
            return
        }

        const nextListId = Number.parseInt(String(payload.list_id ?? ""), 10)
        if (Number.isFinite(nextListId) && nextListId > 0) {
            setSavedListIds((current) => appendUniqueListId(current, nextListId))
            setSelectedListId(nextListId)
            setStatus(`V4 list created (id ${nextListId}).`)
            await fetchListDetail(nextListId)
        } else {
            setStatus("V4 list created.")
        }

        setNewListName("")
        setNewListDescription("")
    }

    async function mutateListItem(action: "add" | "remove") {
        if (!selectedListId) {
            setError("Select a list first.")
            return
        }

        if (!sessionId.trim()) {
            setError("Create a TMDB session first. V4 list writes require a user session id.")
            return
        }

        const mediaId = Number.parseInt(mediaIdInput, 10)
        if (!Number.isFinite(mediaId) || mediaId <= 0) {
            setError("Enter a valid media id.")
            return
        }

        setError(null)
        const response = await fetch(`/api/tmdb?feature=lists`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                action,
                listId: selectedListId,
                mediaId,
                mediaType: mediaTypeInput,
                sessionId,
            }),
        })
        const payload = await response.json()

        if (!response.ok) {
            setError(payload.error ?? `Unable to ${action} item.`)
            return
        }

        setStatus(`Item ${action}ed successfully.`)
        await fetchListDetail(selectedListId)
        await fetchLists()
    }

    async function deleteSelectedList() {
        if (!selectedListId) {
            setError("Select a list first.")
            return
        }

        if (!sessionId.trim()) {
            setError("Create a TMDB session first. V4 list writes require a user session id.")
            return
        }

        setError(null)
        const response = await fetch(
            buildListUrl(selectedListId),
            { method: "DELETE" }
        )
        const payload = await response.json()

        if (!response.ok) {
            setError(payload.error ?? "Unable to delete list.")
            return
        }

        setStatus("List deleted.")
        setSavedListIds((current) => current.filter((entry) => entry !== selectedListId))
        setSelectedListId(null)
        setSelectedListItems([])
    }

    return (
        <main className="min-h-screen bg-muted px-4 py-10 sm:px-6 lg:px-8">
            <div className="mx-auto flex max-w-6xl flex-col gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-2xl font-bold">Dashboard</CardTitle>
                        <CardDescription>
                            Manage TMDB auth session and lists with create, add/remove items, and delete.
                        </CardDescription>
                    </CardHeader>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>TMDB Auth Session</CardTitle>
                        <CardDescription>
                            Sign in once with TMDB login or use request-token approval flow.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-3 md:grid-cols-2">
                        <Input
                            placeholder="TMDB username"
                            value={tmdbUsername}
                            onChange={(event) => setTmdbUsername(event.target.value)}
                        />
                        <Input
                            type="password"
                            placeholder="TMDB password"
                            value={tmdbPassword}
                            onChange={(event) => setTmdbPassword(event.target.value)}
                        />
                        <div className="md:col-span-2">
                            <Button type="button" onClick={signInWithTmdb} disabled={isSigningIn}>
                                {isSigningIn ? "Signing in..." : "Sign In with TMDB"}
                            </Button>
                        </div>

                        <div className="md:col-span-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setShowAdvancedAuth((previous) => !previous)}
                            >
                                {showAdvancedAuth ? "Hide Advanced / Fallback" : "Show Advanced / Fallback"}
                            </Button>
                        </div>

                        {showAdvancedAuth ? (
                            <>
                                <div className="md:col-span-2 flex flex-wrap gap-2">
                                    <Button type="button" onClick={createRequestToken} disabled={isCreatingToken}>
                                        {isCreatingToken ? "Creating token..." : "1. Create Request Token"}
                                    </Button>
                                    {authenticateUrl ? (
                                        <Button type="button" variant="outline" asChild>
                                            <a href={authenticateUrl} target="_blank" rel="noreferrer">
                                                2. Approve Token on TMDB
                                            </a>
                                        </Button>
                                    ) : null}
                                </div>

                                <Input
                                    placeholder="Request token"
                                    value={requestToken}
                                    onChange={(event) => setRequestToken(event.target.value)}
                                />
                                <Button type="button" onClick={createSession} disabled={isCreatingSession}>
                                    {isCreatingSession ? "Creating session..." : "3. Create Session ID"}
                                </Button>

                                {generatedRequestToken ? (
                                    <p className="md:col-span-2 text-xs text-muted-foreground break-all">
                                        Generated token: {generatedRequestToken}
                                    </p>
                                ) : null}
                                {tokenExpiresAt ? (
                                    <p className="md:col-span-2 text-xs text-muted-foreground">
                                        Token expires at: {tokenExpiresAt}
                                    </p>
                                ) : null}
                            </>
                        ) : null}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Lists Setup</CardTitle>
                        <CardDescription>
                            V4 list management uses the app bearer token plus your TMDB session id for private reads and all writes. Save list ids locally to manage them here.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-3 md:grid-cols-2">
                        <div className="md:col-span-2 flex flex-wrap items-center gap-2 rounded-lg border border-border px-3 py-2">
                            <p className="text-sm text-muted-foreground">
                                These credentials are automatically shared and persisted for all pages.
                            </p>
                            <Button type="button" variant="outline" size="sm" onClick={clearCredentials}>
                                Clear Global Credentials
                            </Button>
                        </div>

                        <Input
                            placeholder="Saved v4 list id"
                            value={savedListIdInput}
                            onChange={(event) => setSavedListIdInput(event.target.value)}
                        />
                        <Input
                            placeholder="TMDB account id (optional auth helpers only)"
                            value={accountId}
                            onChange={(event) => setAccountId(event.target.value)}
                        />
                        <div className="md:col-span-2 flex flex-wrap gap-2">
                            <Button type="button" variant="outline" onClick={addSavedListId}>
                                Save List ID
                            </Button>
                            <Button type="button" onClick={fetchLists} disabled={isLoadingLists}>
                                {isLoadingLists ? "Loading..." : "Refresh Saved Lists"}
                            </Button>
                        </div>
                        {error ? <p className="md:col-span-2 text-sm text-destructive">{error}</p> : null}
                        {status ? <p className="md:col-span-2 text-sm text-muted-foreground">{status}</p> : null}
                    </CardContent>
                </Card>

                <div className="grid gap-6 lg:grid-cols-2">
                    <Card>
                        <CardHeader>
                            <CardTitle>Create List</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <Input
                                placeholder="List name"
                                value={newListName}
                                onChange={(event) => setNewListName(event.target.value)}
                            />
                            <Input
                                placeholder="Description"
                                value={newListDescription}
                                onChange={(event) => setNewListDescription(event.target.value)}
                            />
                            <Button type="button" onClick={createList}>
                                Create
                            </Button>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>My Lists</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            {lists.map((list) => (
                                <button
                                    key={list.id}
                                    type="button"
                                    onClick={() => void fetchListDetail(list.id)}
                                    className={`w-full rounded-lg border p-3 text-left ${selectedListId === list.id ? "border-primary" : "border-border"}`}
                                >
                                    <p className="font-semibold">{list.name}</p>
                                    <p className="font-semibold">{list.id}</p>
                                    <p className="text-xs text-muted-foreground">{list.item_count} items</p>
                                </button>
                            ))}
                            {!lists.length ? <p className="text-sm text-muted-foreground">No saved v4 lists yet.</p> : null}
                        </CardContent>
                    </Card>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Selected List</CardTitle>
                        <CardDescription>
                            Add/remove by media id and inspect current list entries.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex flex-wrap gap-2">
                            <Input
                                placeholder="Media id"
                                value={mediaIdInput}
                                onChange={(event) => setMediaIdInput(event.target.value)}
                                className="max-w-40"
                            />
                            <div className="flex items-center gap-2 rounded-lg border border-border p-1">
                                <Button type="button" size="sm" variant={mediaTypeInput === "movie" ? "default" : "ghost"} onClick={() => setMediaTypeInput("movie")}>
                                    Movie
                                </Button>
                                <Button type="button" size="sm" variant={mediaTypeInput === "tv" ? "default" : "ghost"} onClick={() => setMediaTypeInput("tv")}>
                                    TV
                                </Button>
                            </div>
                            <Button type="button" onClick={() => void mutateListItem("add")} disabled={!selectedListId}>
                                Add Item
                            </Button>
                            <Button type="button" variant="outline" onClick={() => void mutateListItem("remove")} disabled={!selectedListId}>
                                Remove Item
                            </Button>
                            <Button type="button" variant="destructive" onClick={deleteSelectedList} disabled={!selectedListId}>
                                Delete List
                            </Button>
                        </div>

                        {isLoadingDetail ? <p className="text-sm text-muted-foreground">Loading list items...</p> : null}

                        <div className="space-y-2">
                            {selectedListItems.map((item) => (
                                <div key={item.id} className="rounded-lg border border-border p-3">
                                    <p className="font-medium">{item.title}</p>
                                    <p className="text-xs text-muted-foreground">{item.type} {item.year ? `• ${item.year}` : ""}</p>
                                </div>
                            ))}
                            {!selectedListItems.length && selectedListId ? (
                                <p className="text-sm text-muted-foreground">No items in this list.</p>
                            ) : null}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </main>
    )
}