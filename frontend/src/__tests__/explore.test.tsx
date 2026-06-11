import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react"
import ExplorePage from "@/app/explore/page"
import type { ExploreDeveloper, ExploreResult } from "@/lib/api"

// next/navigation isn't available outside a Next runtime — stub it.
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn() }),
  usePathname: () => "/explore",
  useSearchParams: () => new URLSearchParams(),
}))

// Stub Sidebar and Navbar so the test focuses on ExplorePage's own logic.
vi.mock("@/components/sidebar", () => ({
  Sidebar: () => null,
}))
vi.mock("@/components/navbar", () => ({
  Navbar: () => null,
}))

// Mock the api functions the page calls.
const fetchTrending = vi.fn()
const searchUsers = vi.fn()
vi.mock("@/lib/api", async () => {
  const actual = await vi.importActual<typeof import("@/lib/api")>("@/lib/api")
  return {
    ...actual,
    fetchTrending: (...args: unknown[]) => fetchTrending(...args),
    searchUsers: (...args: unknown[]) => searchUsers(...args),
  }
})

function dev(overrides: Partial<ExploreDeveloper> = {}): ExploreDeveloper {
  return {
    id: String(Math.random()),
    username: "torvalds",
    name: "Linus Torvalds",
    avatar: "https://example.com/torvalds.png",
    bio: "the kernel guy",
    location: "Portland",
    followers: 200000,
    following: 0,
    repos: 8,
    stars: 100000,
    topLanguages: ["C", "Shell"],
    score: 97,
    contributions: [],
    ...overrides,
  }
}

function ok(developers: ExploreDeveloper[]): ExploreResult {
  return { developers, total: developers.length }
}

beforeEach(() => {
  fetchTrending.mockReset()
  searchUsers.mockReset()
})

afterEach(() => {
  cleanup()
})

describe("ExplorePage", () => {
  it("calls fetchTrending on mount and renders the returned developers", async () => {
    fetchTrending.mockResolvedValue(
      ok([dev({ id: "1", username: "torvalds", name: "Linus Torvalds" })])
    )

    render(<ExplorePage />)

    await waitFor(
      () => expect(fetchTrending).toHaveBeenCalledTimes(1),
      { timeout: 3000 }
    )
    expect(await screen.findByText("Linus Torvalds")).toBeInTheDocument()
  })

  it("calls searchUsers (debounced) after the search form is submitted", async () => {
    fetchTrending.mockResolvedValue(ok([dev({ id: "1" })]))
    searchUsers.mockResolvedValue(
      ok([dev({ id: "2", username: "gaearon", name: "Dan Abramov" })])
    )

    render(<ExplorePage />)
    await waitFor(() => expect(fetchTrending).toHaveBeenCalled(), { timeout: 3000 })

    // The page only commits the search to its `search` state on form submit,
    // and then debounces 600ms before calling searchUsers().
    const input = await screen.findByPlaceholderText(/Search GitHub users/i)
    fireEvent.change(input, { target: { value: "gaearon" } })
    fireEvent.submit(input.closest("form")!)

    await waitFor(
      () => expect(searchUsers).toHaveBeenCalledWith("gaearon"),
      { timeout: 5000 }
    )
  })

  it("shows the empty state when a language filter excludes every developer", async () => {
    fetchTrending.mockResolvedValue(
      ok([dev({ id: "1", username: "pyguy", name: "Py Guy", topLanguages: ["Python"] })])
    )

    render(<ExplorePage />)
    await screen.findByText("Py Guy")

    // Open the filter panel
    fireEvent.click(screen.getByRole("button", { name: /filter/i }))
    // Pick a language that none of the results have
    fireEvent.click(screen.getByRole("button", { name: "Rust" }))

    expect(
      await screen.findByText(/no developers found|no results for filter/i)
    ).toBeInTheDocument()
  })

  it("renders an error message when fetchTrending rejects", async () => {
    fetchTrending.mockRejectedValue(new Error("Network down"))

    render(<ExplorePage />)

    expect(await screen.findByText(/Network down/i)).toBeInTheDocument()
  })
})
