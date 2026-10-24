import { Eye, Palette, Settings2 } from "lucide-react";
import type { ComponentType } from "react";
import AppearanceSection from "./sections/AppearanceSection";
import GeneralSection from "./sections/GeneralSection";
import ViewsSection from "./sections/ViewsSection";

export interface SettingsSection {
  id: string;
  label: string;
  icon: typeof Settings2;
  component: ComponentType;
}

export const SETTINGS_SECTIONS: SettingsSection[] = [
  {
    id: "general",
    label: "General",
    icon: Settings2,
    component: GeneralSection,
  },
  {
    id: "appearance",
    label: "Appearance",
    icon: Palette,
    component: AppearanceSection,
  },
  {
    id: "views",
    label: "Views",
    icon: Eye,
    component: ViewsSection,
  },
];
