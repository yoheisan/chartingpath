import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Core React runtime — small, cached long-term
          'vendor-react': ['react', 'react-dom', 'react/jsx-runtime', 'react-router-dom'],
          // Supabase client
          'vendor-supabase': ['@supabase/supabase-js'],
          // Charting libraries (heavy)
          'vendor-recharts': ['recharts'],
          'vendor-lw-charts': ['lightweight-charts'],
          // UI primitives (Radix)
          'vendor-radix': [
            '@radix-ui/react-dialog',
            '@radix-ui/react-popover',
            '@radix-ui/react-tooltip',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-tabs',
            '@radix-ui/react-select',
            '@radix-ui/react-accordion',
            '@radix-ui/react-toast',
            '@radix-ui/react-scroll-area',
            '@radix-ui/react-toggle-group',
            '@radix-ui/react-toggle',
            '@radix-ui/react-checkbox',
            '@radix-ui/react-switch',
            '@radix-ui/react-slider',
            '@radix-ui/react-progress',
            '@radix-ui/react-radio-group',
            '@radix-ui/react-label',
            '@radix-ui/react-separator',
          ],
          // i18n
          'vendor-i18n': ['i18next', 'react-i18next'],
          // Date utilities
          'vendor-date': ['date-fns', 'date-fns-tz'],
          // TanStack Query
          'vendor-query': ['@tanstack/react-query'],
          // Markdown rendering
          'vendor-markdown': ['react-markdown', 'remark-gfm'],
        },
      },
    },
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "d3-shape/src/pointRadial.js": path.resolve(__dirname, "./src/shims/d3-pointRadial.ts"),
      "./pointRadial.js": path.resolve(__dirname, "./src/shims/d3-pointRadial.ts"),
    },
    dedupe: ["react", "react-dom", "react/jsx-runtime"],
  },
}));
