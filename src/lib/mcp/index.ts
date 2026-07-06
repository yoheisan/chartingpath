import { defineMcp } from "@lovable.dev/mcp-js";
import listActivePatternsTool from "./tools/list-active-patterns";

export default defineMcp({
  name: "chartingpath-mcp",
  title: "ChartingPath MCP",
  version: "0.1.0",
  instructions:
    "Tools for ChartingPath, a chart-pattern trading research platform. Use `list_active_patterns` to fetch currently active chart-pattern detections across stocks, crypto, forex, and commodities.",
  tools: [listActivePatternsTool],
});