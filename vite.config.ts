import { defineConfig } from "vite-plus";

export default defineConfig({
  staged: {
    "*": "vp check --fix",
  },
  pack: {
    entry: [
      "get_info_data.ts",
      "get_scheme_data.ts",
      "get_syllabus_data.ts",
      "get_timetable_data.ts",
      "write_news_alerts.ts",
    ],
  },
  fmt: {
    ignorePatterns: [".vscode/**", "dist/**"],
  },
  lint: {
    plugins: ["typescript", "unicorn", "oxc"],
    categories: {
      correctness: "error",
    },
    rules: {
      "vite-plus/prefer-vite-plus-imports": "error",
    },
    env: {
      builtin: true,
    },
    jsPlugins: [
      {
        name: "vite-plus",
        specifier: "vite-plus/oxlint-plugin",
      },
    ],
  },
});
