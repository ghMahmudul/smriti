import { useEffect } from "react";
import { createBrowserRouter, Navigate, redirect } from "react-router";
import Layout from "./components/layout/Layout";
import RouteErrorBoundary from "./components/RouteErrorBoundary";
import TaskViewContent from "./components/task/TaskViewContent";
import ReconnectScreen from "./components/workspace/ReconnectScreen";
import WorkspacePicker from "./components/workspace/WorkspacePicker";
import { useTaskStore } from "./store/task-store";
import { useWorkspaceStore } from "./store/workspace-store";

export function defaultRedirectLoader() {
  const { mode, settings } = useWorkspaceStore.getState();
  if (!mode) {
    return redirect("/workspaces");
  }
  const defaultView = settings?.defaultView || "all";
  return redirect(`/${defaultView}`);
}

function DefaultRedirect() {
  const mode = useWorkspaceStore((s) => s.mode);
  const defaultView = useWorkspaceStore((s) => s.settings.defaultView);

  if (!mode) {
    return <Navigate to="/workspaces" replace />;
  }

  return <Navigate to={`/${defaultView || "all"}`} replace />;
}

function WorkspaceGuard() {
  const mode = useWorkspaceStore((s) => s.mode);
  const needsReconnect = useWorkspaceStore((s) => s.needsReconnect);
  const folderMissing = useWorkspaceStore((s) => s.folderMissing);
  const isLoaded = useWorkspaceStore((s) => s.isLoaded);
  const reconnectWorkspace = useWorkspaceStore((s) => s.reconnectWorkspace);
  const setFolderMissing = useWorkspaceStore((s) => s.setFolderMissing);

  useEffect(() => {
    if (mode && !isLoaded && !needsReconnect && !folderMissing) {
      reconnectWorkspace().then((adapter) => {
        if (adapter) {
          const { currentWorkspaceId } = useWorkspaceStore.getState();
          useTaskStore
            .getState()
            .loadFiles(adapter, currentWorkspaceId)
            .catch(() => {
              setFolderMissing(true);
            });
        }
      });
    }
  }, [
    mode,
    isLoaded,
    needsReconnect,
    folderMissing,
    reconnectWorkspace,
    setFolderMissing,
  ]);

  if (!mode) {
    return <Navigate to="/workspaces" replace />;
  }

  if (needsReconnect || folderMissing) {
    return <ReconnectScreen />;
  }

  return <Layout />;
}

export const router = createBrowserRouter([
  {
    path: "/workspaces",
    element: <WorkspacePicker />,
    errorElement: <RouteErrorBoundary />,
  },
  {
    path: "/workspace",
    element: <Navigate to="/workspaces" replace />,
  },
  {
    path: "/",
    element: <WorkspaceGuard />,
    errorElement: <RouteErrorBoundary />,
    children: [
      {
        index: true,
        loader: defaultRedirectLoader,
        element: <DefaultRedirect />,
      },
      { path: "all", element: <TaskViewContent /> },
      { path: "inbox", element: <TaskViewContent /> },
      { path: "today", element: <TaskViewContent /> },
      { path: "upcoming", element: <TaskViewContent /> },
      { path: "archived", element: <TaskViewContent /> },
      { path: "completed", element: <TaskViewContent /> },
      { path: "trash", element: <TaskViewContent /> },
      { path: "project/:projectName", element: <TaskViewContent /> },
      { path: "tag/:tagName", element: <TaskViewContent /> },
      { path: "*", element: <Navigate to="/" replace /> },
    ],
  },
]);
