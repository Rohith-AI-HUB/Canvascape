# Canvascape — Competitive Gap Analysis vs. Nimo Browser
**March 2026 · Confidential**

---

## Executive Summary

**Canvascape** is a Windows-first spatial browser built on Electron + React. It renders websites as movable, resizable cards on an infinite canvas — a fundamentally different browsing paradigm from traditional tab-based browsers.

**Nimo** is a macOS-only, invite-only AI-powered spatial browser in private beta. Its core differentiator is a deeply integrated AI layer: AI Cards, Dynamic Apps built from natural language prompts, 100+ app integrations (Gmail, Notion, Slack, Jira, etc.), and MCP server support.

> **Bottom line:** Canvascape's canvas shell is solid and feature-comparable on core UX. The critical gap is the AI layer — Nimo's entire value proposition — which is completely absent from Canvascape today.

---

## Platform Overview

| Category | Canvascape | Nimo |
|---|---|---|
| Platform | **Windows (Electron)** ✅ | macOS only |
| Access | **Open (self-hosted / release)** ✅ | Invite-only beta |
| Pricing | **Free** ✅ | Credit-based subscription |
| Tech Stack | React + React Flow + Zustand | Proprietary |
| Canvas Engine | React Flow 11 | Custom |
| Status | Active development | Private beta |

---

## Feature Parity Matrix

| Feature | Canvascape | Nimo | Gap |
|---|---|---|---|
| Infinite canvas (pan/zoom) | ✅ Full | ✅ Full | None |
| Minimap | ✅ Yes | ✅ Yes | None |
| Web cards (live browsing) | ✅ Webview | ✅ Yes | None |
| Card resize & z-order | ✅ Yes | ✅ Yes | None |
| Traffic-light controls | ✅ Close/Reload/Minimize | ✅ Yes | None |
| Minimize to compact tile | ✅ Yes | ✅ Yes | None |
| Group frames | ✅ With color cycling | ✅ Yes | None |
| Category management | ✅ Full CRUD | ✅ Yes | None |
| Sidebar workspace tree | ✅ Yes | ✅ Yes | None |
| Canvas context menu | ✅ Yes | ✅ Yes | None |
| Dual theme (dark/light) | ✅ Amber accent | ✅ Yes | None |
| Persistent workspace | ✅ JSON | ✅ Yes | None |
| Keyboard shortcuts | ✅ Ctrl+N, Ctrl+\ | ✅ Yes | Minor |
| Time filters | ✅ All / Week / Today | ❓ Unknown | Possible advantage |
| Command palette (Ctrl+K) | ⏳ Roadmap | ✅ Yes | Medium |
| Session history & restore | ⏳ Roadmap | ✅ Yes | Medium |
| Card notes/annotations | ⏳ Roadmap | ✅ AI-contextual | Medium–High |
| Tab stacks per card | ⏳ Roadmap | ✅ Yes | Medium |
| Floating search bar | ⚠️ Built, not mounted | ✅ Yes | Low (quick fix) |

---

## 🔴 Critical Gaps vs. Nimo

### AI Layer (Highest Priority)

The AI layer is Nimo's entire product differentiation. Canvascape is currently a capable spatial browser shell, but has zero AI functionality. This is the single largest gap.

| AI Feature | Nimo | Canvascape |
|---|---|---|
| AI Assistant Panel | Built-in per card & canvas | ❌ Not built |
| Dynamic App Builder | Prompt → custom app from Gmail/Notion/etc. | ❌ Not built |
| App Integrations (100+) | Gmail, Slack, Jira, Notion, Sheets, Calendar… | ❌ None |
| MCP Server Support | 3rd-party app workflows via MCP | ❌ Not built |
| Workspace-aware AI Memory | Per-category persistent context | ❌ Not built |
| AI Orchestration | Coordinate tasks across multiple apps | ❌ Not built |
| Sharing / Collaboration | In development | ❌ Not planned |

---

## ✅ Canvascape Advantages Over Nimo

| Advantage | Detail |
|---|---|
| **Windows-first** | Nimo is macOS-only. Canvascape owns the entire Windows spatial browser market by default. |
| **Open access** | No invite waitlist. Users can install immediately vs. Nimo's controlled beta. |
| **Free pricing** | No credit-based subscription friction. Lower barrier to adoption. |
| **Time filters** | All/Week/Today filtering for node visibility — a unique UX feature not confirmed in Nimo. |
| **Full Electron control** | Full control over webview hardening, IPC, and native OS integration. |

---

## Recommended Roadmap Priorities

| Priority | Feature | Impact | Effort |
|---|---|---|---|
| **P0** | AI assistant side panel (workspace-aware) | 🔴 Critical | High |
| **P0** | Command palette (Ctrl+K) | 🔴 Critical | Medium |
| **P1** | Mount `FloatingSearchBar.jsx` | 🟠 High | Low (quick win) |
| **P1** | App integrations (start with Gmail/Notion) | 🟠 High | Very High |
| **P1** | Session history & restore presets | 🟠 High | Medium |
| **P2** | Card notes/annotations | 🔵 Medium | Medium |
| **P2** | Tab stacks per card | 🔵 Medium | High |
| **P2** | MCP server support | 🔵 Medium | Very High |
| **P3** | Sharing / collaboration | 🟢 Low (now) | Very High |

**Fastest path to parity:** Ship the AI assistant panel → fix the floating search bar → build the command palette. These three items close the most visible gaps with the lowest combined risk.

---

## Known Technical Debt

The following items from `CANVASCAPE_PROJECT.md` should be resolved as part of general codebase hygiene:

- **`BottomComposer.jsx`** — legacy component, not mounted in `App.jsx`. Should be removed or formally deprecated.
- **`FloatingSearchBar.jsx`** — built but not integrated into the active shell. Mount or remove.
- **`CanvasContextMenu.jsx`** — not fully theme-tokenized; uses a legacy light palette instead of CSS tokens.
- **Persistence path mismatch** — dev `workspace.json` in repo root differs from the runtime save path in the user's Documents folder.
- **No automated tests** — store logic and Electron IPC flow are entirely untested.
- **Mixed/legacy encoding artifacts** — some source comments and symbol strings have encoding issues.

---

*This document is based on the Canvascape project memory file and publicly available information about Nimo browser as of March 2026.*