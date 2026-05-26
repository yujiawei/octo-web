import React, { useState, useCallback } from "react";
import { IModule, WKApp, Menus } from "@octo/base";
import FlowListPage from "./pages/FlowListPage";
import FlowEditorPage from "./pages/FlowEditorPage";

/**
 * Flow workflow icon — workflow / DAG glyph (three nodes connected).
 *
 * Active state honours the rail's brand-primary token; the inactive variant
 * keeps a quiet 1.5 stroke so the rail doesn't look noisy when the user is
 * on a different tab.
 */
const FlowIcon: React.FC<{ active?: boolean }> = ({ active }) => {
  const stroke = active ? "var(--wk-brand-primary, #5b6abf)" : "#999";
  const sw = active ? 2 : 1.5;
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke={stroke}
      strokeWidth={sw}
      strokeLinecap="round"
      strokeLinejoin="round"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="5" cy="6" r="2" />
      <circle cx="19" cy="6" r="2" />
      <circle cx="12" cy="18" r="2" />
      <path d="M7 6h10M6 8l5 8M18 8l-5 8" />
    </svg>
  );
};

/**
 * Internal view orchestrator for the Flow tab.
 *
 * `WKApp.route` is a flat path → component map without segment matching, so
 * we can't literally register `/flows/:id/edit` as a route. Instead, the
 * Flow tab renders one wrapper component that owns local view state and
 * flips between the list and the editor in-place. Both `FlowListPage` and
 * `FlowEditorPage` already accept callback-based navigation (`onEdit`,
 * `onHistory`, `onCreate`, `onBack`), so all the wrapper has to do is feed
 * those callbacks back into its own state.
 *
 * `initialFlowId` lets external entry points (deep links, future param
 * routes) jump straight into the editor for a known flow.
 */
type FlowAppProps = {
  initialFlowId?: string;
};

type FlowView =
  | { kind: "list" }
  | { kind: "editor"; flowId: string };

const FlowApp: React.FC<FlowAppProps> = ({ initialFlowId }) => {
  const [view, setView] = useState<FlowView>(
    initialFlowId
      ? { kind: "editor", flowId: initialFlowId }
      : { kind: "list" },
  );

  const goEdit = useCallback((flowId: string) => {
    setView({ kind: "editor", flowId });
  }, []);

  const goList = useCallback(() => {
    setView({ kind: "list" });
  }, []);

  const spaceId = WKApp.shared.currentSpaceId || undefined;

  if (view.kind === "editor") {
    return <FlowEditorPage flowId={view.flowId} onBack={goList} />;
  }
  return (
    <FlowListPage
      spaceId={spaceId}
      onEdit={goEdit}
      onHistory={goEdit /* FlowEditorPage owns the history view internally */}
      onCreate={(flow) => goEdit(flow.id)}
    />
  );
};

/** Guard against double-init (HMR in dev or future module lifecycle changes). */
let _initialized = false;

if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    _initialized = false;
  });
}

export default class FlowModule implements IModule {
  id(): string {
    return "FlowModule";
  }

  init(): void {
    if (_initialized) return;
    _initialized = true;

    // Canonical route — entered via the NavRail menu.
    WKApp.route.register("/flow", () => <FlowApp />);

    // Param-route entry points so deep links / cross-module navigation can
    // land directly on the editor / executions for a specific flow without
    // needing the user to click through the list first. The plural `/flows`
    // prefix matches the REST-style spelling the issue spec uses.
    const editorEntry = (param: { flowId?: string } | undefined) => (
      <FlowApp initialFlowId={param?.flowId || undefined} />
    );
    WKApp.route.register("/flow/edit", editorEntry);
    WKApp.route.register("/flow/executions", editorEntry);
    WKApp.route.register("/flows", () => <FlowApp />);
    WKApp.route.register("/flows/edit", editorEntry);
    WKApp.route.register("/flows/executions", editorEntry);

    // Top-level NavRail entry. Sort weight 6500 keeps Flow after the
    // existing Summary (5000) and AppBot (6000) entries.
    WKApp.menus.register(
      "flow",
      () => {
        const m = new Menus(
          "flow",
          "/flow",
          "Flow",
          <FlowIcon />,
          <FlowIcon active />,
        );
        return m;
      },
      6500,
    );
  }
}
