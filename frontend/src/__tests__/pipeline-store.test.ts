import { describe, it, expect, beforeEach } from "vitest"
import { usePipelineStore, PIPELINE_STAGES } from "@/lib/pipeline-store"

function reset() {
  usePipelineStore.setState({ candidates: [] })
}

function dev(overrides: Partial<{
  id: string; username: string; name: string; avatar: string;
  bio: string; topLanguages: string[]; stars: number;
  followers: number; repos: number; score: number;
}> = {}) {
  return {
    id: "u1",
    username: "torvalds",
    name: "Linus Torvalds",
    avatar: "https://example.com/avatar.png",
    bio: "kernel",
    topLanguages: ["C", "Shell"],
    stars: 100000,
    followers: 200000,
    repos: 8,
    score: 97,
    ...overrides,
  }
}

beforeEach(() => {
  reset()
  localStorage.clear()
})

describe("usePipelineStore — actions", () => {
  it("starts empty", () => {
    expect(usePipelineStore.getState().candidates).toEqual([])
  })

  it("addCandidate adds a candidate with default stage 'sourced'", () => {
    usePipelineStore.getState().addCandidate(dev())
    const cs = usePipelineStore.getState().candidates
    expect(cs).toHaveLength(1)
    expect(cs[0].stage).toBe("sourced")
    expect(cs[0].username).toBe("torvalds")
    expect(typeof cs[0].addedAt).toBe("number")
  })

  it("addCandidate is idempotent on duplicate id", () => {
    const candidate = dev()
    usePipelineStore.getState().addCandidate(candidate)
    usePipelineStore.getState().addCandidate({ ...candidate, name: "Linus 2" })
    expect(usePipelineStore.getState().candidates).toHaveLength(1)
    expect(usePipelineStore.getState().candidates[0].name).toBe("Linus Torvalds")
  })

  it("addCandidate is idempotent on duplicate username", () => {
    usePipelineStore.getState().addCandidate(dev({ id: "u1" }))
    usePipelineStore.getState().addCandidate(dev({ id: "u2", username: "TORVALDS" }))
    expect(usePipelineStore.getState().candidates).toHaveLength(1)
  })

  it("moveCandidate updates the stage", () => {
    usePipelineStore.getState().addCandidate(dev())
    usePipelineStore.getState().moveCandidate("u1", "interviewing")
    expect(usePipelineStore.getState().candidates[0].stage).toBe("interviewing")
  })

  it("removeCandidate drops the matching candidate", () => {
    usePipelineStore.getState().addCandidate(dev({ id: "u1", username: "torvalds" }))
    usePipelineStore.getState().addCandidate(dev({ id: "u2", username: "gaearon" }))
    usePipelineStore.getState().removeCandidate("u1")
    expect(usePipelineStore.getState().candidates).toHaveLength(1)
    expect(usePipelineStore.getState().candidates[0].username).toBe("gaearon")
  })

  it("clearAll empties the pipeline", () => {
    usePipelineStore.getState().addCandidate(dev({ id: "u1" }))
    usePipelineStore.getState().addCandidate(dev({ id: "u2", username: "gaearon" }))
    usePipelineStore.getState().clearAll()
    expect(usePipelineStore.getState().candidates).toEqual([])
  })

  it("reorderInStage keeps order within a stage and preserves others", () => {
    const s = usePipelineStore.getState()
    s.addCandidate(dev({ id: "a", username: "a" }))
    s.addCandidate(dev({ id: "b", username: "b" }))
    s.addCandidate(dev({ id: "c", username: "c" }))
    s.moveCandidate("c", "review")

    s.reorderInStage("sourced", ["b", "a"])
    const after = usePipelineStore.getState().candidates
    const sourced = after.filter((c) => c.stage === "sourced").map((c) => c.id)
    expect(sourced).toEqual(["b", "a"])
    // Candidate in another stage stays put
    expect(after.find((c) => c.id === "c")?.stage).toBe("review")
  })
})

describe("PIPELINE_STAGES", () => {
  it("declares the four expected stages in order", () => {
    expect(PIPELINE_STAGES.map((s) => s.id)).toEqual([
      "sourced",
      "review",
      "interviewing",
      "shortlisted",
    ])
  })
})

describe("persist middleware → localStorage", () => {
  it("writes the candidates list to localStorage on change", async () => {
    usePipelineStore.getState().addCandidate(dev())
    // Zustand persist writes synchronously after set()
    const raw = localStorage.getItem("devlens-pipeline")
    expect(raw).toBeTruthy()
    const parsed = JSON.parse(raw!)
    expect(parsed.state.candidates).toHaveLength(1)
    expect(parsed.state.candidates[0].username).toBe("torvalds")
  })
})
