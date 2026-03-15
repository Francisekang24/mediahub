"use client"

import * as React from "react"

type TmdbAuthContextValue = {
    accountId: string
    sessionId: string
    isHydrated: boolean
    setAccountId: (value: string) => void
    setSessionId: (value: string) => void
    clearCredentials: () => void
}

const ACCOUNT_ID_KEY = "tmdb.auth.accountId"
const SESSION_ID_KEY = "tmdb.auth.sessionId"

const TmdbAuthContext = React.createContext<TmdbAuthContextValue | null>(null)

export function TmdbAuthProvider({ children }: { children: React.ReactNode }) {
    const [accountId, setAccountId] = React.useState("")
    const [sessionId, setSessionId] = React.useState("")
    const [hydrated, setHydrated] = React.useState(false)

    React.useEffect(() => {
        setAccountId(localStorage.getItem(ACCOUNT_ID_KEY) ?? "")
        setSessionId(localStorage.getItem(SESSION_ID_KEY) ?? "")
        setHydrated(true)
    }, [])

    React.useEffect(() => {
        if (!hydrated) return
        localStorage.setItem(ACCOUNT_ID_KEY, accountId)
    }, [accountId, hydrated])

    React.useEffect(() => {
        if (!hydrated) return
        localStorage.setItem(SESSION_ID_KEY, sessionId)
    }, [sessionId, hydrated])

    const value = React.useMemo<TmdbAuthContextValue>(() => {
        return {
            accountId,
            sessionId,
            isHydrated: hydrated,
            setAccountId,
            setSessionId,
            clearCredentials: () => {
                setAccountId("")
                setSessionId("")
                localStorage.removeItem(ACCOUNT_ID_KEY)
                localStorage.removeItem(SESSION_ID_KEY)
            },
        }
    }, [accountId, hydrated, sessionId])

    return <TmdbAuthContext.Provider value={value}>{children}</TmdbAuthContext.Provider>
}

export function useTmdbAuth() {
    const context = React.useContext(TmdbAuthContext)
    if (!context) {
        throw new Error("useTmdbAuth must be used within TmdbAuthProvider")
    }
    return context
}
