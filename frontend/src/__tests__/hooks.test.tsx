import { describe, it, expect, vi, beforeEach } from "vitest"
import { renderHook, waitFor } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { useUserAnalytics } from "@/lib/hooks"
import type { ReactNode } from "react"

vi.mock("@/lib/api", () => ({
  fetchUserAnalytics: vi.fn(),
  fetchAISummary: vi.fn(),
}))

import { fetchUserAnalytics } from "@/lib/api"

const mockFetchUserAnalytics = fetchUserAnalytics as ReturnType<typeof vi.fn>

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

describe("useUserAnalytics", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("returns data when fetch succeeds", async () => {
    mockFetchUserAnalytics.mockResolvedValue({
      username: "testuser",
      followers: 100,
      total_stars: 500,
    })

    const { result } = renderHook(() => useUserAnalytics("testuser"), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.username).toBe("testuser")
    expect(result.current.data?.followers).toBe(100)
  })

  it("is not enabled when username is empty", () => {
    const { result } = renderHook(() => useUserAnalytics(""), {
      wrapper: createWrapper(),
    })
    expect(result.current.isFetching).toBe(false)
  })
})
