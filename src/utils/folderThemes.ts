import { Folder, Library, Download, Monitor, Image, Music, Video, LucideIcon } from "lucide-react";

export interface FolderTheme {
  icon: LucideIcon;
  Icon: LucideIcon;
  color: string;
  badge: string;
}

export const getFolderTheme = (name: string): FolderTheme => {
  const normalized = name.toLowerCase();
  
  // Shared color style system (Slate theme matching Applications)
  const sharedColor = "text-slate-400 border-slate-500/10 bg-slate-500/10";

  if (normalized.includes("home")) {
    return {
      icon: Folder,
      Icon: Folder,
      color: sharedColor,
      badge: "Home",
    };
  }
  if (normalized.includes("document") || normalized.includes("library")) {
    return {
      icon: Library,
      Icon: Library,
      color: sharedColor,
      badge: "Documents",
    };
  }
  if (normalized.includes("download")) {
    return {
      icon: Download,
      Icon: Download,
      color: sharedColor,
      badge: "Downloads",
    };
  }
  if (normalized.includes("desktop")) {
    return {
      icon: Monitor,
      Icon: Monitor,
      color: sharedColor,
      badge: "Desktop",
    };
  }
  if (normalized.includes("picture") || normalized.includes("image")) {
    return {
      icon: Image,
      Icon: Image,
      color: sharedColor,
      badge: "Pictures",
    };
  }
  if (normalized.includes("music") || normalized.includes("audio")) {
    return {
      icon: Music,
      Icon: Music,
      color: sharedColor,
      badge: "Music",
    };
  }
  if (normalized.includes("video") || normalized.includes("movie") || normalized.includes("clip")) {
    return {
      icon: Video,
      Icon: Video,
      color: sharedColor,
      badge: "Videos",
    };
  }
  return {
    icon: Folder,
    Icon: Folder,
    color: sharedColor,
    badge: "Folder",
  };
};
