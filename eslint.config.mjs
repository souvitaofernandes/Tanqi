import { dirname } from "path"
import { fileURLToPath } from "url"
import coreWebVitals from "eslint-config-next/core-web-vitals"
import tsConfig from "eslint-config-next/typescript"

const __dirname = dirname(fileURLToPath(import.meta.url))

/** @type {import('eslint').Linter.Config[]} */
const config = [
  // Exclude files that are not application code
  {
    ignores: ["public/sw.js"],
  },
  ...coreWebVitals,
  ...tsConfig,
  {
    settings: {
      next: {
        rootDir: __dirname,
      },
    },
    rules: {
      // The react-hooks/set-state-in-effect rule flags legitimate patterns:
      //   - useEffect(() => setMounted(true), []) for hydration safety
      //   - setIsMobile() in a useEffect that subscribes to matchMedia
      //   - setDisplay() in a reduced-motion early-return branch
      // These are all intentional one-shot or event-driven state syncs.
      // Downgrade to warn so they're visible but don't break CI.
      "react-hooks/set-state-in-effect": "warn",
    },
  },
]

export default config
