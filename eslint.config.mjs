import nextPlugin from "eslint-config-next"

const eslintConfig = [
  ...nextPlugin,
  {
    ignores: [".next/**", "out/**", "node_modules/**"],
  },
  {
    rules: {
      // Initial-mount setState in effects (media query listeners, timers) is a
      // standard, correct pattern; this experimental rule over-flags it.
      "react-hooks/set-state-in-effect": "off",
    },
  },
]

export default eslintConfig
