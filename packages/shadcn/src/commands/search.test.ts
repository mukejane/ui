import { ensureRegistriesInConfig } from "@/src/utils/registries"
import { searchRegistries } from "@/src/registry/search"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { search } from "./search"

const baseConfig = {
  $schema: "",
  style: "new-york",
  rsc: false,
  tsx: true,
  tailwind: {
    config: "",
    css: "",
    baseColor: "neutral",
    cssVariables: true,
    prefix: "",
  },
  aliases: {
    components: "@/components",
    ui: "@/components/ui",
    hooks: "@/hooks",
    lib: "@/lib",
    utils: "@/lib/utils",
  },
  registries: {},
  resolvedPaths: {
    cwd: "/tmp/test-project",
    tailwindConfig: "",
    tailwindCss: "",
    utils: "",
    components: "",
    lib: "",
    hooks: "",
    ui: "",
  },
}

const mockResults = {
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
}

vi.mock("fs-extra", () => ({
  default: {
    existsSync: vi.fn(() => false),
    readJson: vi.fn(),
  },
}))

vi.mock("@/src/utils/env-loader", () => ({
  loadEnvFiles: vi.fn(),
}))

vi.mock("@/src/utils/get-config", () => ({
  createConfig: vi.fn(() => baseConfig),
  getConfig: vi.fn(() => null),
}))

vi.mock("@/src/utils/registries", () => ({
  ensureRegistriesInConfig: vi.fn(() => ({
    config: baseConfig,
    newRegistries: [],
  })),
}))

vi.mock("@/src/registry/validator", () => ({
  validateRegistryConfigForItems: vi.fn(),
}))

vi.mock("@/src/registry/search", () => ({
  searchRegistries: vi.fn(() => mockResults),
}))

vi.mock("@/src/registry/context", () => ({
  clearRegistryContext: vi.fn(),
}))

vi.mock("@/src/utils/handle-error", () => ({
  handleError: vi.fn((error) => {
    throw error
  }),
}))

describe("search command", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("only discovers namespace registries for search inputs", async () => {
    const log = vi.spyOn(console, "log").mockImplementation(() => {})
    const exit = mockProcessExit()

    await expect(
      search.parseAsync(
        [
          "@acme",
          "acme/ui",
          "https://example.com/registry.json",
          "--cwd",
          "/tmp/test-project",
        ],
        {
          from: "user",
        }
      )
    ).rejects.toThrow("process.exit:0")

    expect(ensureRegistriesInConfig).toHaveBeenCalledWith(
      ["@acme/registry"],
      expect.any(Object),
      {
        silent: true,
        writeFile: false,
      }
    )

    log.mockRestore()
    exit.mockRestore()
  })

  it("prints human-readable output by default", async () => {
    const log = vi.spyOn(console, "log").mockImplementation(() => {})
    const exit = mockProcessExit()

    await expect(
      search.parseAsync(["@shadcn", "--cwd", "/tmp/test-project"], {
        from: "user",
      })
    ).rejects.toThrow("process.exit:0")

    expect(searchRegistries).toHaveBeenCalled()
    expect(log).toHaveBeenCalledWith(
      expect.stringContaining("Found 2 items in @shadcn")
    )
    expect(log).toHaveBeenCalledWith(
      expect.stringContaining("@shadcn/button")
    )
    expect(log).not.toHaveBeenCalledWith(
      expect.stringContaining('"pagination"')
    )

    log.mockRestore()
    exit.mockRestore()
  })

  it("prints JSON output with --json", async () => {
    const log = vi.spyOn(console, "log").mockImplementation(() => {})
    const exit = mockProcessExit()

    await expect(
      search.parseAsync(
        ["@shadcn", "--cwd", "/tmp/test-project", "--json"],
        {
          from: "user",
        }
      )
    ).rejects.toThrow("process.exit:0")

    expect(log).toHaveBeenCalledWith(JSON.stringify(mockResults, null, 2))

    log.mockRestore()
    exit.mockRestore()
  })
})

function mockProcessExit() {
  return vi.spyOn(process, "exit").mockImplementation((code) => {
    throw new Error(`process.exit:${code}`)
  })
}
