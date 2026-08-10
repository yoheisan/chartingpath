import { auth, defineMcp } from "@lovable.dev/mcp-js";
import listActivePatternsTool from "./tools/list-active-patterns";

export default defineMcp({
  name: "chartingpath-mcp",
  title: "ChartingPath MCP",
  version: "0.1.0",
  instructions:
    "Tools for ChartingPath, a chart-pattern trading research platform. Use `list_active_patterns` to fetch currently active chart-pattern detections across stocks, crypto, forex, and commodities.",
  tools: [listActivePatternsTool],
  // Require a valid Supabase-issued OAuth access token. Without this the MCP
  // endpoint is callable by anyone who knows the URL once the app is published.
  auth: auth.oauth.issuer({
    issuer: "https://dgznlsckoamseqcpzfqm.supabase.co/auth/v1",
    jwksUri: "https://dgznlsckoamseqcpzfqm.supabase.co/auth/v1/.well-known/jwks.json",
    acceptedAudiences: ["authenticated"],
    resourceName: "ChartingPath MCP",
  }),
});