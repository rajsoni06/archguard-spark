import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { DesignerWorkspace } from "@/components/designer/DesignerWorkspace";
import { SetupScreen } from "@/components/designer/SetupScreen";
import type { ProjectContext } from "@/lib/ruleEngine";
import { clearSession, loadContext, saveContext } from "@/lib/session";

const TITLE = "Architecture Designer — ArchGuard AI";
const DESCRIPTION =
  "Design AWS, Azure or GCP architectures on a drag-and-drop canvas and review them with a deterministic security, scalability and reliability rule engine.";

export const Route = createFileRoute("/designer")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
    ],
  }),
  component: DesignerPage,
});

function DesignerPage() {
  const [ctx, setCtx] = useState<ProjectContext | null>(null);
  const [editing, setEditing] = useState(false);
  const [restored, setRestored] = useState(false);

  // Restore the active project so navigating away and back never resets setup.
  useEffect(() => {
    setCtx(loadContext());
    setRestored(true);
  }, []);

  if (!restored) return <AppShell>{null}</AppShell>;

  return (
    <AppShell>
      {!ctx || editing ? (
        <SetupScreen
          {...(ctx ? { initial: ctx } : {})}
          onStart={(next) => {
            setCtx(next);
            saveContext(next);
            setEditing(false);
          }}
          {...(ctx ? { onCancel: () => setEditing(false) } : {})}
        />
      ) : (
        <DesignerWorkspace
          ctx={ctx}
          onEditContext={() => setEditing(true)}
          onNewProject={() => {
            clearSession();
            setCtx(null);
            setEditing(false);
          }}
        />
      )}
    </AppShell>
  );
}
