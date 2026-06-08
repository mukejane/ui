import { searchResultsSchema } from "@/src/schema"
import { highlighter } from "@/src/utils/highlighter"
import { logger } from "@/src/utils/logger"
import { z } from "zod"

export const SEARCH_RESULT_DESCRIPTION_MAX_LENGTH = 80

export function formatSearchResultType(type?: string) {
  if (!type) {
    return ""
  }

  return type.startsWith("registry:") ? type.slice("registry:".length) : type
}

export function formatSearchResultDescription(
  description: string,
  maxLength = SEARCH_RESULT_DESCRIPTION_MAX_LENGTH
) {
  const normalized = description.trim().replace(/\s+/g, " ")

  if (normalized.length <= maxLength) {
    return normalized
  }

  const truncated = normalized.slice(0, maxLength - 3).trimEnd()
  const lastSpace = truncated.lastIndexOf(" ")
  const base =
    lastSpace > maxLength * 0.6 ? truncated.slice(0, lastSpace) : truncated

  return `${base.trimEnd()}...`
}

function formatSearchResultItem(
  item: z.infer<typeof searchResultsSchema>["items"][number],
  options: {
    showRegistry: boolean
  }
) {
  const name = item.addCommandArgument ?? item.name
  const type = formatSearchResultType(item.type)
  const typeSuffix = type ? ` (${type})` : ""
  const registrySuffix =
    options.showRegistry && item.registry ? ` · ${item.registry}` : ""
  const descriptionSuffix = item.description
    ? ` — ${formatSearchResultDescription(item.description)}`
    : ""

  return `- ${highlighter.info(name)}${typeSuffix}${registrySuffix}${descriptionSuffix}`
}

export function printSearchResults(
  results: z.infer<typeof searchResultsSchema>,
  options: {
    query?: string
    registries: string[]
  }
) {
  const { pagination, items } = results
  const { query, registries } = options
  const showRegistry = registries.length > 1

  if (items.length === 0) {
    let message = "No items found"
    if (query) {
      message += ` matching ${highlighter.info(`"${query}"`)}`
    }
    if (registries.length > 0) {
      message += ` in ${registries.join(", ")}`
    }
    logger.warn(`${message}.`)
    return
  }

  let header = `Found ${pagination.total} item${
    pagination.total === 1 ? "" : "s"
  }`
  if (query) {
    header += ` matching "${query}"`
  }
  if (registries.length > 0) {
    header += ` in ${registries.join(", ")}`
  }
  logger.info(header)

  const start = pagination.offset + 1
  const end = Math.min(
    pagination.offset + pagination.limit,
    pagination.total
  )
  logger.log(`Showing ${start}-${end} of ${pagination.total}`)
  logger.break()

  logger.log(
    items.map((item) => formatSearchResultItem(item, { showRegistry })).join("\n")
  )

  if (pagination.hasMore) {
    logger.break()
    logger.log(
      `More items available. Use ${highlighter.info(
        `--offset ${pagination.offset + pagination.limit}`
      )} to see the next page.`
    )
  }
}
