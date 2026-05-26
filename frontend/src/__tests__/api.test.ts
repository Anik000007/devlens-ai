import { describe, it, expect, vi, beforeEach } from "vitest"
import {
  fetchUser,
  fetchUserAnalytics,
  fetchAISummary,
  fetchTrending,
  searchUsers,
  fetchRepoAnalysis,
  compareUsers,
  fetchResumePoints,
  ApiError,
} from "@/lib/api"

const mockFetch = vi.fn()

beforeEach(() => {
  global.fetch = mockFetch
  vi.clearAllMocks()
})

function mockResponse(status: number, data: unknown) {
  return Promise.resolve({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(data),
  })
}

describe("ApiError", () => {
  it("creates error with status and message", () => {
    const err = new ApiError(404, "Not found")
    expect(err.status).toBe(404)
    expect(err.message).toBe("Not found")
    expect(err.name).toBe("ApiError")
  })
})

describe("fetchUser()", () => {
  it("fetches user profile", async () => {
    mockFetch.mockResolvedValue(mockResponse(200, { username: "testuser", name: "Test" }))
    const user = await fetchUser("testuser")
    expect(user.username).toBe("testuser")
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("/user/testuser"),
      expect.any(Object)
    )
  })

  it("throws ApiError on 404", async () => {
    mockFetch.mockResolvedValue(mockResponse(404, { detail: "Not found" }))
    await expect(fetchUser("unknown")).rejects.toThrow(ApiError)
  })

  it("throws ApiError on timeout", async () => {
    mockFetch.mockRejectedValue(new DOMException("Aborted", "AbortError"))
    await expect(fetchUser("testuser")).rejects.toThrow(ApiError)
  })
})

describe("fetchUserAnalytics()", () => {
  it("fetches analytics data", async () => {
    const data = { username: "testuser", followers: 100, total_stars: 500 }
    mockFetch.mockResolvedValue(mockResponse(200, data))
    const result = await fetchUserAnalytics("testuser")
    expect(result.followers).toBe(100)
  })
})

describe("fetchAISummary()", () => {
  it("sends POST request with profile data", async () => {
    mockFetch.mockResolvedValue(mockResponse(200, { summary: "Great dev" }))
    const result = await fetchAISummary({ username: "testuser", name: "Test" })
    expect(result.summary).toBe("Great dev")
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("/ai/summary"),
      expect.objectContaining({ method: "POST" })
    )
  })
})

describe("fetchTrending()", () => {
  it("fetches trending developers", async () => {
    mockFetch.mockResolvedValue(mockResponse(200, { developers: [], total: 0 }))
    const result = await fetchTrending()
    expect(result.total).toBe(0)
  })
})

describe("searchUsers()", () => {
  it("URL-encodes the query", async () => {
    mockFetch.mockResolvedValue(mockResponse(200, { developers: [], total: 0 }))
    await searchUsers("test user")
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining(encodeURIComponent("test user")),
      expect.any(Object)
    )
  })
})

describe("fetchRepoAnalysis()", () => {
  it("fetches repo analysis", async () => {
    mockFetch.mockResolvedValue(mockResponse(200, { name: "my-repo", owner: "testuser" }))
    const result = await fetchRepoAnalysis("testuser", "my-repo")
    expect(result.name).toBe("my-repo")
  })
})

describe("compareUsers()", () => {
  it("sends POST with both usernames", async () => {
    mockFetch.mockResolvedValue(mockResponse(200, { developer_a: {}, developer_b: {}, ai_analysis: "" }))
    const result = await compareUsers("user1", "user2")
    expect(result.developer_a).toBeDefined()
    expect(result.developer_b).toBeDefined()
  })
})

describe("fetchResumePoints()", () => {
  it("fetches resume bullets", async () => {
    mockFetch.mockResolvedValue(mockResponse(200, { bullets: ["Built X"] }))
    const result = await fetchResumePoints({ username: "testuser" })
    expect(result.bullets).toEqual(["Built X"])
  })
})
