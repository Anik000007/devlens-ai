import { describe, it, expect, vi, beforeEach } from "vitest"
import {
  fetchProjectMatches,
  fetchCareerPath,
  fetchCareerRoles,
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

describe("fetchCareerRoles()", () => {
  it("fetches the supported target roles", async () => {
    mockFetch.mockResolvedValue(
      mockResponse(200, { roles: ["Full-Stack Engineer", "Backend Engineer"] })
    )
    const res = await fetchCareerRoles()
    expect(res.roles).toHaveLength(2)
    expect(res.roles[0]).toBe("Full-Stack Engineer")
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("/ai/career-roles"),
      expect.any(Object)
    )
  })

  it("surfaces a 429 rate-limit error", async () => {
    mockFetch.mockResolvedValue(
      mockResponse(429, { detail: "GitHub rate limit exhausted" })
    )
    await expect(fetchCareerRoles()).rejects.toThrow(ApiError)
  })
})

describe("fetchCareerPath()", () => {
  it("POSTs the simulated skill profile + target role", async () => {
    mockFetch.mockResolvedValue(
      mockResponse(200, {
        current_role: "Software Engineer",
        target_role: "DevOps / SRE",
        gap_analysis: "Strong fundamentals.",
        milestones: [],
        timeline: "3-6 months",
        key_technologies: ["Docker", "Kubernetes"],
      })
    )
    const res = await fetchCareerPath({
      username: "torvalds",
      target_role: "DevOps / SRE",
      skills: [{ skill: "Backend", value: 85 }],
    })
    expect(res.target_role).toBe("DevOps / SRE")
    const [, init] = mockFetch.mock.calls[0]
    expect(init.method).toBe("POST")
    const body = JSON.parse(init.body)
    expect(body.target_role).toBe("DevOps / SRE")
    expect(body.skills[0]).toEqual({ skill: "Backend", value: 85 })
  })

  it("propagates 404 as ApiError", async () => {
    mockFetch.mockResolvedValue(mockResponse(404, { detail: "user not found" }))
    await expect(
      fetchCareerPath({ username: "ghost", target_role: "Backend Engineer" })
    ).rejects.toThrow(ApiError)
  })
})

describe("fetchProjectMatches()", () => {
  it("POSTs the skill profile and returns matches", async () => {
    mockFetch.mockResolvedValue(
      mockResponse(200, {
        summary: "Found 2 strong matches.",
        matches: [
          {
            repo: "facebook/react",
            issue_title: "Improve docs",
            issue_url: "https://github.com/facebook/react/issues/1",
            issue_number: 1,
            labels: ["good first issue"],
            language: "JavaScript",
            match_score: 0.87,
            reason: "Strong frontend skills",
            created_at: "2026-01-01T00:00:00Z",
            updated_at: "2026-01-02T00:00:00Z",
            comments: 3,
            body_snippet: "Help wanted",
          },
        ],
      })
    )
    const res = await fetchProjectMatches({
      username: "torvalds",
      top_languages: ["C", "Rust"],
      skills: [{ skill: "Systems", value: 95 }],
    })
    expect(res.matches).toHaveLength(1)
    expect(res.matches[0].match_score).toBe(0.87)
    const [, init] = mockFetch.mock.calls[0]
    expect(init.method).toBe("POST")
    expect(JSON.parse(init.body).username).toBe("torvalds")
  })

  it("returns an empty list when backend reports no matches", async () => {
    mockFetch.mockResolvedValue(
      mockResponse(200, { summary: "No matches", matches: [] })
    )
    const res = await fetchProjectMatches({ username: "torvalds" })
    expect(res.matches).toEqual([])
  })

  it("surfaces a 500 error with the backend detail", async () => {
    mockFetch.mockResolvedValue(
      mockResponse(500, { detail: "internal error" })
    )
    try {
      await fetchProjectMatches({ username: "torvalds" })
      expect.fail("should have thrown")
    } catch (err) {
      expect(err).toBeInstanceOf(ApiError)
      expect((err as ApiError).status).toBe(500)
      expect((err as ApiError).message).toBe("internal error")
    }
  })
})
