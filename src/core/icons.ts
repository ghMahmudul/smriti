import type { LucideIcon } from "lucide-react";
import {
  Activity,
  AlertCircle,
  Anchor,
  Apple,
  Archive,
  AtSign,
  Award,
  BarChart3,
  Bell,
  Bike,
  Blocks,
  Bookmark,
  BookOpen,
  Bot,
  Box,
  Briefcase,
  Brush,
  Bug,
  Building,
  Calculator,
  Calendar,
  Camera,
  Car,
  CheckSquare,
  ClipboardList,
  Clock,
  Cloud,
  Code,
  Coffee,
  Compass,
  Cpu,
  CreditCard,
  Database,
  DollarSign,
  Dumbbell,
  Feather,
  FileText,
  Film,
  Flag,
  Flame,
  Folder,
  Footprints,
  Gamepad2,
  GitBranch,
  Globe,
  GraduationCap,
  Hammer,
  HardDrive,
  Hash,
  Headphones,
  Heart,
  HeartPulse,
  Home,
  Inbox,
  Key,
  Landmark,
  Laptop,
  Layers,
  Lightbulb,
  ListTodo,
  Lock,
  Luggage,
  Mail,
  Map as MapIcon,
  MapPin,
  Megaphone,
  MessageSquare,
  MessagesSquare,
  Mic,
  Moon,
  Mountain,
  Music,
  Navigation,
  Newspaper,
  Palette,
  PartyPopper,
  Phone,
  Pill,
  Pin,
  Plane,
  Presentation,
  Receipt,
  Rocket,
  Scissors,
  Send,
  Server,
  Share2,
  Shield,
  ShoppingBag,
  ShoppingCart,
  Smartphone,
  Smile,
  Sparkles,
  Star,
  Store,
  Sun,
  Tag,
  Target,
  Terminal,
  Train,
  TreePine,
  TrendingUp,
  Trophy,
  User,
  Users,
  Utensils,
  Video,
  Wallet,
  Wand2,
  Wifi,
  Wrench,
} from "lucide-react";

export interface IconDefinition {
  id: string;
  name: string;
  icon: LucideIcon;
  keywords: string[];
}

export const ICON_REGISTRY: IconDefinition[] = [
  // Planning & Tasks
  {
    id: "folder",
    name: "Folder",
    icon: Folder,
    keywords: ["directory", "project", "files"],
  },
  {
    id: "tag",
    name: "Tag",
    icon: Tag,
    keywords: ["label", "badge", "category"],
  },
  {
    id: "hash",
    name: "Hash",
    icon: Hash,
    keywords: ["number", "topic", "tag", "channel"],
  },
  {
    id: "bookmark",
    name: "Bookmark",
    icon: Bookmark,
    keywords: ["favorite", "save", "remember"],
  },
  {
    id: "star",
    name: "Star",
    icon: Star,
    keywords: ["favorite", "important", "rating", "top"],
  },
  {
    id: "check-square",
    name: "Check Square",
    icon: CheckSquare,
    keywords: ["task", "todo", "done", "complete"],
  },
  {
    id: "list-todo",
    name: "Todo List",
    icon: ListTodo,
    keywords: ["tasks", "checklist", "plan"],
  },
  {
    id: "calendar",
    name: "Calendar",
    icon: Calendar,
    keywords: ["date", "schedule", "event"],
  },
  {
    id: "clock",
    name: "Clock",
    icon: Clock,
    keywords: ["time", "alarm", "schedule"],
  },
  {
    id: "bell",
    name: "Bell",
    icon: Bell,
    keywords: ["notification", "alert", "reminder"],
  },
  {
    id: "flag",
    name: "Flag",
    icon: Flag,
    keywords: ["milestone", "priority", "goal"],
  },
  {
    id: "pin",
    name: "Pin",
    icon: Pin,
    keywords: ["pinned", "important", "location", "note"],
  },
  {
    id: "alert-circle",
    name: "Alert",
    icon: AlertCircle,
    keywords: ["warning", "urgent", "attention", "danger"],
  },
  {
    id: "target",
    name: "Target",
    icon: Target,
    keywords: ["goal", "aim", "focus", "objective"],
  },
  {
    id: "archive",
    name: "Archive",
    icon: Archive,
    keywords: ["saved", "storage", "box"],
  },

  // Work & Finance
  {
    id: "briefcase",
    name: "Briefcase",
    icon: Briefcase,
    keywords: ["work", "job", "career", "business"],
  },
  {
    id: "building",
    name: "Building",
    icon: Building,
    keywords: ["office", "company", "firm", "corporate"],
  },
  {
    id: "landmark",
    name: "Bank",
    icon: Landmark,
    keywords: ["finance", "institution", "government"],
  },
  {
    id: "presentation",
    name: "Presentation",
    icon: Presentation,
    keywords: ["slides", "pitch", "meeting", "deck"],
  },
  {
    id: "calculator",
    name: "Calculator",
    icon: Calculator,
    keywords: ["math", "accounting", "finance", "budget"],
  },
  {
    id: "file-text",
    name: "Document",
    icon: FileText,
    keywords: ["file", "paper", "notes", "contract"],
  },
  {
    id: "clipboard-list",
    name: "Clipboard",
    icon: ClipboardList,
    keywords: ["audit", "inspection", "survey", "form"],
  },
  {
    id: "dollar-sign",
    name: "Dollar",
    icon: DollarSign,
    keywords: ["money", "cash", "finance", "currency"],
  },
  {
    id: "wallet",
    name: "Wallet",
    icon: Wallet,
    keywords: ["money", "cards", "payment", "expenses"],
  },
  {
    id: "credit-card",
    name: "Credit Card",
    icon: CreditCard,
    keywords: ["payment", "bank", "purchase", "shopping"],
  },
  {
    id: "receipt",
    name: "Receipt",
    icon: Receipt,
    keywords: ["bill", "expense", "tax", "invoice"],
  },
  {
    id: "trending-up",
    name: "Trending Up",
    icon: TrendingUp,
    keywords: ["growth", "stats", "success", "performance"],
  },
  {
    id: "bar-chart-3",
    name: "Bar Chart",
    icon: BarChart3,
    keywords: ["analytics", "metrics", "data", "report"],
  },
  {
    id: "award",
    name: "Award",
    icon: Award,
    keywords: ["prize", "achievement", "medal"],
  },
  {
    id: "trophy",
    name: "Trophy",
    icon: Trophy,
    keywords: ["winner", "competition", "achievement", "success"],
  },

  // Tech & Development
  {
    id: "code",
    name: "Code",
    icon: Code,
    keywords: ["programming", "developer", "syntax", "coding"],
  },
  {
    id: "terminal",
    name: "Terminal",
    icon: Terminal,
    keywords: ["command", "cli", "shell", "bash", "console"],
  },
  {
    id: "laptop",
    name: "Laptop",
    icon: Laptop,
    keywords: ["computer", "pc", "mac", "tech"],
  },
  {
    id: "database",
    name: "Database",
    icon: Database,
    keywords: ["sql", "storage", "backend", "data"],
  },
  {
    id: "server",
    name: "Server",
    icon: Server,
    keywords: ["hosting", "cloud", "backend", "network"],
  },
  {
    id: "bug",
    name: "Bug",
    icon: Bug,
    keywords: ["issue", "defect", "error", "fix"],
  },
  {
    id: "cpu",
    name: "CPU",
    icon: Cpu,
    keywords: ["processor", "chip", "hardware", "performance"],
  },
  {
    id: "bot",
    name: "Bot",
    icon: Bot,
    keywords: ["robot", "ai", "automation", "assistant"],
  },
  {
    id: "globe",
    name: "Globe",
    icon: Globe,
    keywords: ["web", "world", "internet", "website", "online"],
  },
  {
    id: "shield",
    name: "Shield",
    icon: Shield,
    keywords: ["security", "safe", "privacy", "protection"],
  },
  {
    id: "wrench",
    name: "Wrench",
    icon: Wrench,
    keywords: ["tool", "settings", "fix", "repair"],
  },
  {
    id: "hard-drive",
    name: "Hard Drive",
    icon: HardDrive,
    keywords: ["disk", "storage", "memory"],
  },
  {
    id: "smartphone",
    name: "Smartphone",
    icon: Smartphone,
    keywords: ["mobile", "phone", "app", "ios", "android"],
  },
  {
    id: "wifi",
    name: "WiFi",
    icon: Wifi,
    keywords: ["wireless", "internet", "network", "connect"],
  },
  {
    id: "git-branch",
    name: "Git Branch",
    icon: GitBranch,
    keywords: ["vcs", "repository", "merge", "git"],
  },
  {
    id: "layers",
    name: "Layers",
    icon: Layers,
    keywords: ["stack", "design", "architecture"],
  },
  {
    id: "blocks",
    name: "Blocks",
    icon: Blocks,
    keywords: ["lego", "modular", "components", "plugin"],
  },

  // Design & Creative
  {
    id: "palette",
    name: "Palette",
    icon: Palette,
    keywords: ["design", "color", "art", "theme"],
  },
  {
    id: "brush",
    name: "Brush",
    icon: Brush,
    keywords: ["paint", "art", "draw", "creative"],
  },
  {
    id: "feather",
    name: "Feather",
    icon: Feather,
    keywords: ["write", "author", "blog", "story"],
  },
  {
    id: "sparkles",
    name: "Sparkles",
    icon: Sparkles,
    keywords: ["magic", "clean", "ai", "special", "new"],
  },
  {
    id: "wand-2",
    name: "Wand",
    icon: Wand2,
    keywords: ["magic", "wizard", "automatic", "smart"],
  },
  {
    id: "camera",
    name: "Camera",
    icon: Camera,
    keywords: ["photo", "picture", "photography", "image"],
  },
  {
    id: "film",
    name: "Film",
    icon: Film,
    keywords: ["video", "movie", "cinema", "media"],
  },
  {
    id: "video",
    name: "Video",
    icon: Video,
    keywords: ["record", "movie", "youtube", "stream"],
  },
  {
    id: "music",
    name: "Music",
    icon: Music,
    keywords: ["song", "audio", "track", "sound"],
  },
  {
    id: "headphones",
    name: "Headphones",
    icon: Headphones,
    keywords: ["audio", "listen", "podcast", "music"],
  },
  {
    id: "mic",
    name: "Microphone",
    icon: Mic,
    keywords: ["voice", "record", "podcast", "speech"],
  },
  {
    id: "book-open",
    name: "Book",
    icon: BookOpen,
    keywords: ["read", "study", "learning", "documentation"],
  },
  {
    id: "newspaper",
    name: "Newspaper",
    icon: Newspaper,
    keywords: ["news", "articles", "press", "journal"],
  },
  {
    id: "lightbulb",
    name: "Lightbulb",
    icon: Lightbulb,
    keywords: ["idea", "innovation", "concept", "insight"],
  },

  // Life & Health
  {
    id: "home",
    name: "Home",
    icon: Home,
    keywords: ["house", "family", "chores", "living"],
  },
  {
    id: "coffee",
    name: "Coffee",
    icon: Coffee,
    keywords: ["break", "morning", "cafe", "drink"],
  },
  {
    id: "utensils",
    name: "Dining",
    icon: Utensils,
    keywords: ["food", "restaurant", "meal", "cook", "kitchen"],
  },
  {
    id: "apple",
    name: "Nutrition",
    icon: Apple,
    keywords: ["fruit", "healthy", "diet", "food"],
  },
  {
    id: "heart",
    name: "Heart",
    icon: Heart,
    keywords: ["love", "favorite", "health", "like"],
  },
  {
    id: "heart-pulse",
    name: "Health",
    icon: HeartPulse,
    keywords: ["medical", "pulse", "care", "wellness"],
  },
  {
    id: "activity",
    name: "Activity",
    icon: Activity,
    keywords: ["fitness", "stats", "health", "tracking"],
  },
  {
    id: "dumbbell",
    name: "Fitness",
    icon: Dumbbell,
    keywords: ["gym", "workout", "exercise", "training"],
  },
  {
    id: "footprints",
    name: "Walking",
    icon: Footprints,
    keywords: ["steps", "hiking", "outdoors"],
  },
  {
    id: "pill",
    name: "Medication",
    icon: Pill,
    keywords: ["medicine", "pharmacy", "health", "prescription"],
  },
  {
    id: "smile",
    name: "Smile",
    icon: Smile,
    keywords: ["happy", "fun", "mood", "personal"],
  },
  {
    id: "flame",
    name: "Flame",
    icon: Flame,
    keywords: ["fire", "hot", "streak", "urgent", "energy"],
  },
  {
    id: "sun",
    name: "Sun",
    icon: Sun,
    keywords: ["day", "weather", "summer", "morning"],
  },
  {
    id: "moon",
    name: "Moon",
    icon: Moon,
    keywords: ["night", "sleep", "dark", "evening"],
  },
  {
    id: "cloud",
    name: "Cloud",
    icon: Cloud,
    keywords: ["weather", "sky", "sync"],
  },
  {
    id: "tree-pine",
    name: "Nature",
    icon: TreePine,
    keywords: ["outdoor", "park", "forest", "green"],
  },
  {
    id: "gamepad-2",
    name: "Gaming",
    icon: Gamepad2,
    keywords: ["games", "play", "fun", "entertainment"],
  },
  {
    id: "party-popper",
    name: "Celebration",
    icon: PartyPopper,
    keywords: ["party", "event", "birthday", "milestone"],
  },

  // Places & Travel
  {
    id: "plane",
    name: "Flight",
    icon: Plane,
    keywords: ["travel", "vacation", "trip", "airplane"],
  },
  {
    id: "car",
    name: "Car",
    icon: Car,
    keywords: ["vehicle", "drive", "road", "commute"],
  },
  {
    id: "bike",
    name: "Bicycle",
    icon: Bike,
    keywords: ["cycling", "ride", "exercise"],
  },
  {
    id: "train",
    name: "Train",
    icon: Train,
    keywords: ["transit", "railway", "commute", "travel"],
  },
  {
    id: "map-pin",
    name: "Location",
    icon: MapPin,
    keywords: ["place", "address", "gps", "spot"],
  },
  {
    id: "map",
    name: "Map",
    icon: MapIcon,
    keywords: ["navigation", "trip", "directions", "explore"],
  },
  {
    id: "navigation",
    name: "Navigation",
    icon: Navigation,
    keywords: ["compass", "direction", "gps"],
  },
  {
    id: "luggage",
    name: "Luggage",
    icon: Luggage,
    keywords: ["suitcase", "bag", "packing", "travel"],
  },
  {
    id: "rocket",
    name: "Rocket",
    icon: Rocket,
    keywords: ["launch", "startup", "fast", "space", "ship"],
  },
  {
    id: "anchor",
    name: "Anchor",
    icon: Anchor,
    keywords: ["marine", "boat", "stable", "sea"],
  },
  {
    id: "mountain",
    name: "Mountain",
    icon: Mountain,
    keywords: ["climb", "nature", "outdoor", "peak"],
  },
  {
    id: "compass",
    name: "Compass",
    icon: Compass,
    keywords: ["direction", "explore", "guide"],
  },

  // Objects & Communication
  {
    id: "box",
    name: "Box",
    icon: Box,
    keywords: ["container", "storage", "package"],
  },
  {
    id: "lock",
    name: "Lock",
    icon: Lock,
    keywords: ["security", "password", "private", "access"],
  },
  {
    id: "key",
    name: "Key",
    icon: Key,
    keywords: ["access", "auth", "secret", "token"],
  },
  {
    id: "shopping-cart",
    name: "Shopping Cart",
    icon: ShoppingCart,
    keywords: ["buy", "ecommerce", "store", "groceries"],
  },
  {
    id: "shopping-bag",
    name: "Shopping Bag",
    icon: ShoppingBag,
    keywords: ["retail", "fashion", "purchase"],
  },
  {
    id: "store",
    name: "Store",
    icon: Store,
    keywords: ["shop", "market", "business"],
  },
  {
    id: "message-square",
    name: "Message",
    icon: MessageSquare,
    keywords: ["chat", "comment", "discussion", "talk"],
  },
  {
    id: "messages-square",
    name: "Chat",
    icon: MessagesSquare,
    keywords: ["conversation", "team", "dialogue"],
  },
  {
    id: "mail",
    name: "Mail",
    icon: Mail,
    keywords: ["email", "letter", "inbox", "newsletter"],
  },
  {
    id: "send",
    name: "Send",
    icon: Send,
    keywords: ["outbox", "paperplane", "publish", "message"],
  },
  {
    id: "phone",
    name: "Phone",
    icon: Phone,
    keywords: ["call", "contact", "support"],
  },
  {
    id: "user",
    name: "User",
    icon: User,
    keywords: ["person", "profile", "account", "me"],
  },
  {
    id: "users",
    name: "Team",
    icon: Users,
    keywords: ["group", "people", "collaborators", "community"],
  },
  {
    id: "share-2",
    name: "Share",
    icon: Share2,
    keywords: ["social", "link", "distribute"],
  },
  {
    id: "megaphone",
    name: "Announcement",
    icon: Megaphone,
    keywords: ["marketing", "broadcast", "shout", "news"],
  },
  {
    id: "at-sign",
    name: "Mention",
    icon: AtSign,
    keywords: ["email", "user", "contact", "handle"],
  },
  {
    id: "graduation-cap",
    name: "Education",
    icon: GraduationCap,
    keywords: ["school", "university", "course", "learn"],
  },
  {
    id: "scissors",
    name: "Scissors",
    icon: Scissors,
    keywords: ["cut", "edit", "craft"],
  },
  {
    id: "hammer",
    name: "Hammer",
    icon: Hammer,
    keywords: ["build", "construction", "repair"],
  },
];

const ICON_MAP = new Map<string, IconDefinition>();
for (const item of ICON_REGISTRY) {
  ICON_MAP.set(item.id.toLowerCase(), item);
  // Also register camelCase or name variations
  const simplified = item.name.toLowerCase().replace(/[^a-z0-9]/g, "");
  ICON_MAP.set(simplified, item);
}

export function getIconDefinition(
  id?: string | null,
): IconDefinition | undefined {
  if (!id) return undefined;
  const key = id.toLowerCase().trim();
  return ICON_MAP.get(key) || ICON_MAP.get(key.replace(/[^a-z0-9]/g, ""));
}

export function getIconComponent(
  id?: string | null,
  fallback: LucideIcon = Folder,
): LucideIcon {
  if (!id) return fallback;
  const def = getIconDefinition(id);
  return def ? def.icon : fallback;
}

export function getProjectIcon(
  projectName: string,
  projectIcons?: Record<string, string>,
  fallback: LucideIcon = Folder,
): LucideIcon {
  const cleanName = projectName.replace(/\.todo$/i, "");
  if (cleanName.toLowerCase() === "inbox") {
    return Inbox;
  }
  const customId = projectIcons?.[cleanName] ?? projectIcons?.[projectName];
  return getIconComponent(customId, fallback);
}

export function getTagIcon(
  tagName: string,
  tagIcons?: Record<string, string>,
  fallback: LucideIcon = Tag,
): LucideIcon {
  const cleanTag = tagName.startsWith("#") ? tagName.slice(1) : tagName;
  const customId = tagIcons?.[cleanTag] ?? tagIcons?.[tagName];
  return getIconComponent(customId, fallback);
}

export function searchIcons(query: string): IconDefinition[] {
  const normalizedQuery = query.toLowerCase().trim();
  if (!normalizedQuery) {
    return ICON_REGISTRY;
  }

  return ICON_REGISTRY.filter((item) => {
    return (
      item.id.includes(normalizedQuery) ||
      item.name.toLowerCase().includes(normalizedQuery) ||
      item.keywords.some((k) => k.includes(normalizedQuery))
    );
  });
}
