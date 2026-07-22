import { defineConfig } from "tsdown";

export default defineConfig({
  entry: [
    "get_info_data.ts",
    "get_scheme_data.ts",
    "get_syllabus_data.ts",
    "get_timetable_data.ts",
    "write_news_alerts.ts",
  ],
});
