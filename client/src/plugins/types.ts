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
import type { ComponentType } from 'react';

/**
 * Plugin definition.
 *
 * Each plugin is fully independent — it owns its UI, state, API hooks, toolbar.
 * Plugins share only the authentication session.
 */
export interface PluginDefinition {
  /** Unique identifier (e.g. 'explorer', 'google') */
  id: string;

  /** Human-readable label shown in nav bar and toolbar */
  label: string;

  /** Material icon name (e.g. 'folder_open', 'search') */
  icon: string;

  /**
   * Main component rendered when this plugin is active.
   * Optional if `url` is set (external link plugins have no in-app content).
   */
  content?: ComponentType;

  /**
   * External URL. If set, clicking this plugin opens the URL
   * in a new browser tab instead of rendering in-app content.
   */
  url?: string;

  /** Sort order in the nav bar. Lower = higher. Explorer uses 0. */
  order: number;

  /** Show this plugin in the left navigation bar. Default: true */
  navbar?: boolean;

  /** Show this plugin in the top toolbar. Default: false */
  toolbar?: boolean;

  /** Default visible state. If true, the plugin is shown on startup. */
  visible?: boolean;

  /** Display index — controls the rendering order independently of `order`. */
  index?: number;
}
