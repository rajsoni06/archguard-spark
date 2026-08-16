import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { DesignerWorkspace } from "@/components/designer/DesignerWorkspace";
import { SetupScreen } from "@/components/designer/SetupScreen";
import type { ProjectContext } from "@/lib/ruleEngine";

const TITLE = "Architecture Designer — ArchGuard AI";
const DESCRIPTION =
  "Design AWS, Azure or GCP architectures on a drag-and-drop canvas and review them with a deterministic security, scalability and reliability rule engine.";

export const Route = createFileRoute("/")({
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

  return (
    <AppShell>
      {!ctx || editing ? (
        <SetupScreen
          {...(ctx ? { initial: ctx } : {})}
          onStart={(next) => {
            setCtx(next);
            setEditing(false);
          }}
          {...(ctx ? { onCancel: () => setEditing(false) } : {})}
        />
      ) : (
        <DesignerWorkspace ctx={ctx} onEditContext={() => setEditing(true)} />
      )}
    </AppShell>
  );
}
