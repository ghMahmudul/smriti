import { useRouteError } from "react-router";
import ErrorFallback from "./ui/ErrorFallback";

export default function RouteErrorBoundary() {
  const error = useRouteError();
  return <ErrorFallback error={error} />;
}
