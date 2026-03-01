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
import type { PluginDefinition } from '../types';
import { AppShell } from '../../components/layout/AppShell';

/**
 * Explorer plugin — the primary tool for navigating the entity tree.
 * Uses the existing AppShell component as-is, with no modifications.
 */
export const explorerPlugin: PluginDefinition = {
  id: 'explorer',
  label: 'Business Explorer',
  icon: 'folder_open',
  content: AppShell,
  order: 0,
  navbar: true,
  toolbar: true,
};
