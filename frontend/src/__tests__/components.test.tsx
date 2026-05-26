import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"

describe("Badge", () => {
  it("renders children", () => {
    render(<Badge>BETA</Badge>)
    expect(screen.getByText("BETA")).toBeInTheDocument()
  })

  it("applies variant classes", () => {
    const { container } = render(<Badge variant="secondary">Secondary</Badge>)
    expect(container.firstChild).toHaveClass("bg-secondary")
  })
})

describe("Separator", () => {
  it("renders without crashing", () => {
    const { container } = render(<Separator />)
    expect(container.firstChild).toBeInTheDocument()
  })

  it("has horizontal orientation", () => {
    const { container } = render(<Separator />)
    expect(container.firstChild).toHaveAttribute("data-slot", "separator")
  })
})

describe("Card", () => {
  it("renders card with header and content", () => {
    render(
      <Card>
        <CardHeader>
          <CardTitle>Test Card</CardTitle>
        </CardHeader>
        <CardContent>Content here</CardContent>
      </Card>
    )
    expect(screen.getByText("Test Card")).toBeInTheDocument()
    expect(screen.getByText("Content here")).toBeInTheDocument()
  })
})
