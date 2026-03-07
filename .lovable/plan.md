

## Make AI Copilot header look like a filled button

**What changes**: Update the copilot header bar in both `TradingCopilot.tsx` and `CopilotSidebar.tsx` to use a solid filled background (matching the primary-to-accent gradient used on the trigger button) instead of the current subtle `from-primary/10 to-accent/10` tint.

### Changes

**`src/components/copilot/TradingCopilot.tsx` (line 449)**
- Change header from `bg-gradient-to-r from-primary/10 to-accent/10` to `bg-gradient-to-r from-primary to-accent text-white`
- Update icon buttons inside to use white/translucent-white styling so they remain visible on the filled background
- Remove or adjust the separate sparkle circle since the whole bar is now the accent color

**`src/components/copilot/CopilotSidebar.tsx` (line 316)**
- Same treatment: solid filled gradient background with white text and icons

### Visual result
The header will appear as a bold, filled gradient bar (like a large button) with white text and icons, giving it a more prominent, button-like appearance.

