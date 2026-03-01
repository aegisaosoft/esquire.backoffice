import React from 'react';
import { Menu, MenuItem, ListItemIcon, ListItemText, Divider } from '@mui/material';
import Icon from '@mui/material/Icon';

export interface ContextMenuItem {
  label: string;
  icon?: string;
  onClick: () => void;
  disabled?: boolean;
  dividerAfter?: boolean;
  children?: ContextMenuItem[]; // submenu (not nested for simplicity — flat list)
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
        const elements: React.ReactNode[] = [
          <MenuItem
            key={`item-${i}`}
            onClick={() => { item.onClick(); onClose(); }}
            disabled={item.disabled}
          >
            {item.icon && (
              <ListItemIcon>
                <Icon fontSize="small">{item.icon}</Icon>
              </ListItemIcon>
            )}
            <ListItemText>{item.label}</ListItemText>
          </MenuItem>,
        ];
        if (item.dividerAfter) {
          elements.push(<Divider key={`div-${i}`} />);
        }
        return elements;
      })}
    </Menu>
  );
};
