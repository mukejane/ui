import {
  formatSearchResultDescription,
  formatSearchResultType,
  printSearchResults,
  SEARCH_RESULT_DESCRIPTION_MAX_LENGTH,
} from "@/src/utils/format-search-results"
import { describe, expect, it, vi } from "vitest"

describe("formatSearchResultType", () => {
  it("strips the registry prefix", () => {
    expect(formatSearchResultType("registry:ui")).toBe("ui")
    expect(formatSearchResultType("registry:block")).toBe("block")
  })

  it("returns other types unchanged", () => {
    expect(formatSearchResultType("custom:type")).toBe("custom:type")
    expect(formatSearchResultType(undefined)).toBe("")
  })
})

describe("formatSearchResultDescription", () => {
  it("returns short descriptions unchanged", () => {
    expect(formatSearchResultDescription("A simple login form.")).toBe(
      "A simple login form."
    )
  })

  it("truncates long descriptions with an ellipsis", () => {
    const description =
      "A dashboard with sidebar, charts, data table, filters, and many other widgets for managing your application."

    const formatted = formatSearchResultDescription(description)

    expect(formatted.length).toBeLessThanOrEqual(
      SEARCH_RESULT_DESCRIPTION_MAX_LENGTH
    )
    expect(formatted.endsWith("...")).toBe(true)
    expect(formatted).not.toBe(description)
  })
})

describe("printSearchResults", () => {
  it("prints type and description inline", async () => {
    const log = vi.spyOn(console, "log").mockImplementation(() => {})

    printSearchResults(
      {
        pagination: {
          total: 2,
          offset: 0,
          limit: 100,
          hasMore: false,
        },
        items: [
          {
            name: "button",
            type: "registry:ui",
            description: "A button component",
            registry: "@shadcn",
            addCommandArgument: "@shadcn/button",
          },
          {
            name: "card",
            type: "registry:ui",
            registry: "@shadcn",
            addCommandArgument: "@shadcn/card",
          },
        ],
      },
      {
        query: "button",
        registries: ["@shadcn"],
      }
    )

    expect(log).toHaveBeenCalledWith(
      expect.stringContaining('Found 2 items matching "button" in @shadcn')
    )
    expect(log).toHaveBeenCalledWith(
      expect.stringContaining("Showing 1-2 of 2")
    )
    expect(log).toHaveBeenCalledWith(
      expect.stringMatching(
        /- @shadcn\/button \(ui\) — A button component\n- @shadcn\/card \(ui\)$/
      )
    )

    log.mockRestore()
  })

  it("prints registry when searching multiple registries", async () => {
    const log = vi.spyOn(console, "log").mockImplementation(() => {})

    printSearchResults(
      {
        pagination: {
          total: 1,
          offset: 0,
          limit: 100,
          hasMore: false,
        },
        items: [
          {
            name: "header",
            type: "registry:component",
            description: "A header component",
            registry: "@custom",
            addCommandArgument: "@custom/header",
          },
        ],
      },
      {
        registries: ["@shadcn", "@custom"],
      }
    )

    expect(log).toHaveBeenCalledWith(
      expect.stringMatching(
        /- @custom\/header \(component\) · @custom — A header component/
      )
    )

    log.mockRestore()
  })

  it("prints a warning when no items are found", async () => {
    const log = vi.spyOn(console, "log").mockImplementation(() => {})

    printSearchResults(
      {
        pagination: {
          total: 0,
          offset: 0,
          limit: 100,
          hasMore: false,
        },
        items: [],
      },
      {
        query: "missing",
        registries: ["@shadcn"],
      }
    )

    expect(log).toHaveBeenCalledWith(
      expect.stringContaining('No items found matching "missing" in @shadcn')
    )

    log.mockRestore()
  })
})
