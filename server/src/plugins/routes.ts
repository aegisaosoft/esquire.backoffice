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
import { Router } from 'express';

const router = Router();

/**
 * Plugin toolbar placement.
 *
 * - "main"   — top-level toolbar button
 * - { menu: "Title" } — item inside a submenu with the given title
 */
interface ToolbarPlacement {
  show: boolean;
  placement?: 'main' | { menu: string };
}

/**
 * Plugin metadata returned by GET /plugins.
 */
interface PluginMeta {
  /** Unique plugin identifier (e.g. "explorer", "reports") */
  id: string;

  /** Human-readable title */
  title: string;

  /** Material icon name */
  icon: string;

  /** Client-side route/URL for the plugin */
  url: string;

  /** Sort order (lower = first) */
  order: number;

  /** Show in left navigation bar? */
  navbar: boolean;

  /** Toolbar placement */
  toolbar: ToolbarPlacement;
}

/**
 * Stub plugin registry.
 * In the future this can be loaded from database or config file.
 */
const pluginsMeta: PluginMeta[] = [
  {
    id: 'explorer',
    title: 'Explorer',
    icon: 'folder_open',
    url: '/explorer',
    order: 0,
    navbar: true,
    toolbar: { show: true, placement: 'main' },
  },
  {
    id: 'reports',
    title: 'Reports',
    icon: 'assessment',
    url: '/reports',
    order: 10,
    navbar: true,
    toolbar: { show: true, placement: { menu: 'Tools' } },
  },
  {
    id: 'multiplier',
    title: 'Multiplier',
    icon: 'dynamic_feed',
    url: '/multiplier',
    order: 20,
    navbar: true,
    toolbar: { show: true, placement: { menu: 'Tools' } },
  },
  {
    id: 'settings',
    title: 'Settings',
    icon: 'settings',
    url: '/settings',
    order: 100,
    navbar: true,
    toolbar: { show: false },
  },
];

/**
 * GET /plugins
 * Returns the list of available plugins with their metadata.
 */
router.get('/', (_req, res) => {
  res.json(pluginsMeta);
});

export const pluginRoutes = router;
