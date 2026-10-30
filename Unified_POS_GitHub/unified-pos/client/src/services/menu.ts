import type { MenuItem, BarLocation } from "../types";
import { menu as menuApi } from "./api";

// Cache loaded from API
let menuCache: MenuItem[] = [];
let loaded = false;

export async function loadMenu(): Promise<MenuItem[]> {
  menuCache = await menuApi.list();
  loaded = true;
  return menuCache;
}

export function getMenuItems(): MenuItem[] {
  return menuCache;
}

export function getCategories(): string[] {
  return [...new Set(menuCache.map(item => item.category))];
}

export function getItemsByCategory(category: string): MenuItem[] {
  return menuCache.filter(item => item.category === category);
}

export function getAvailableBars(item: MenuItem): BarLocation[] {
  return item.availableAt.split(",") as BarLocation[];
}

export function isAvailableAt(item: MenuItem, bar: BarLocation): boolean {
  return item.availableAt.split(",").includes(bar);
}

export function resolveRouteTo(item: MenuItem, tabBar: BarLocation): BarLocation {
  const bars = getAvailableBars(item);
  return bars.includes(tabBar) ? tabBar : bars[0];
}

export function needsCrossBarRequest(item: MenuItem, tabBar: BarLocation): boolean {
  return !isAvailableAt(item, tabBar);
}

export function isMenuLoaded(): boolean {
  return loaded;
}

export function searchMenu(query: string): MenuItem[] {
  const q = query.toLowerCase().trim();
  if (!q) return [];
  return menuCache.filter(item =>
    item.name.toLowerCase().includes(q) || item.category.toLowerCase().includes(q)
  );
}

// Track popular items in memory resets on reload - good enough for a shift
const orderCounts: Record<string, number> = {};

export function trackOrder(itemId: string) {
  orderCounts[itemId] = (orderCounts[itemId] || 0) + 1;
}

export function getPopularItems(limit = 8): MenuItem[] {
  const sorted = Object.entries(orderCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([id]) => id);

  return sorted
    .map(id => menuCache.find(item => item.id === id))
    .filter((item): item is MenuItem => !!item);
}
