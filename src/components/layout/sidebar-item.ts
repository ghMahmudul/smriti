interface SidebarItemStateOpts {
  bordered?: boolean;
}

export function sidebarItemState(
  isActive: boolean,
  opts?: SidebarItemStateOpts,
): string {
  if (isActive) {
    return opts?.bordered
      ? "bg-sidebar-selected! border-muted-foreground/40 text-sidebar-foreground"
      : "bg-sidebar-selected! text-sidebar-foreground";
  }
  return opts?.bordered
    ? "bg-sidebar-accent/50 text-sidebar-foreground hover:bg-sidebar-accent hover:border-muted-foreground/30"
    : "text-sidebar-foreground hover:bg-sidebar-accent";
}
