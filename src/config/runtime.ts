export type DataMode = "auto" | "prototype" | "api"

const rawDataMode = (import.meta.env.VITE_DATA_MODE ?? "auto").toLowerCase()

function normalizeDataMode(value: string): DataMode {
  if (value === "prototype" || value === "api" || value === "auto") {
    return value
  }

  return "auto"
}

export const dataMode: DataMode = normalizeDataMode(rawDataMode)

export function isPrototypeMode() {
  return dataMode === "prototype"
}

export function isApiOnlyMode() {
  return dataMode === "api"
}
