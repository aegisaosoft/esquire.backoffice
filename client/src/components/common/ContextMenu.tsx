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
import React from 'react';
import { Menu, MenuItem, ListItemIcon, ListItemText, Typography, Divider } from '@mui/material';
import Icon from '@mui/material/Icon';

export interface ContextMenuItem {
  label: string;
  icon?: string;
  shortcut?: string;           // keyboard shortcut hint (e.g. "Alt+Enter")
  onClick: () => void;
  disabled?: boolean;
  dividerAfter?: boolean;
  dividerBefore?: boolean;
}

interface ContextMenuProps {
  open: boolean;
  position: { x: number; y: number } | null;
  items: ContextMenuItem[];
  onClose: () => void;
}

export const ContextMenu: React.FC<ContextMenuProps> = ({ open, position, items, onClose }) => {
  if (!position) return null;

  return (
    <Menu
      open={open}
      onClose={onClose}
      anchorReference="anchorPosition"
      anchorPosition={{ top: position.y, left: position.x }}
    >
      {items.flatMap((item, i) => {
        const elements: React.ReactNode[] = [];
        if (item.dividerBefore && i > 0) {
          elements.push(<Divider key={`divb-${i}`} />);
        }
        elements.push(
          <MenuItem
            key={`item-${i}`}
            onClick={() => { item.onClick(); onClose(); }}
            disabled={item.disabled}
            sx={{ minWidth: 200 }}
          >
            {item.icon && (
              <ListItemIcon>
                <Icon baseClassName="material-icons-outlined" fontSize="small">{item.icon}</Icon>
              </ListItemIcon>
            )}
            <ListItemText>{item.label}</ListItemText>
            {item.shortcut && (
              <Typography variant="body2" color="text.secondary" sx={{ ml: 3, fontSize: '0.75rem' }}>
                {item.shortcut}
              </Typography>
            )}
          </MenuItem>,
        );
        if (item.dividerAfter) {
          elements.push(<Divider key={`diva-${i}`} />);
        }
        return elements;
      })}
    </Menu>
  );
};
