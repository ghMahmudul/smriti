import { RouterProvider } from "react-router";
import { Toaster } from "./components/ui/sonner";
import { useAppUpdate } from "./hooks/useAppUpdate";
import { useTheme } from "./hooks/useTheme";
import { router } from "./router";

export default function App() {
  useTheme();
  useAppUpdate();

  return (
    <>
      <RouterProvider router={router} />
      <Toaster position="top-right" richColors />
    </>
  );
}
