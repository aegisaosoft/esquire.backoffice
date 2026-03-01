/**
 * Esquire Backoffice
 * Copyright (C) 2026 AegisAOSoft
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */
import type { PluginDefinition } from './types';
import { explorerPlugin } from './explorer/explorerPlugin';
import { reportsPlugin } from './google/googlePlugin';

/**
 * Master list of all registered plugins.
 * To add a new plugin, import its definition and append it here.
 */
export const plugins: PluginDefinition[] = [
  explorerPlugin,
  reportsPlugin,
];

/** Plugins sorted by order (for nav bar rendering). */
export function getSortedPlugins(): PluginDefinition[] {
  return [...plugins].sort((a, b) => a.order - b.order);
}

/** Plugins that belong to the left nav bar. */
export function getNavbarPlugins(): PluginDefinition[] {
  return getSortedPlugins().filter(p => p.navbar !== false);
}

/** Plugins that belong to the top toolbar. */
export function getToolbarPlugins(): PluginDefinition[] {
  return getSortedPlugins().filter(p => p.toolbar === true);
}

/** The default plugin (first by order). */
export function getDefaultPlugin(): PluginDefinition {
  return getSortedPlugins()[0];
}
