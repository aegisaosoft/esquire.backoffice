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
import React, { useCallback, useMemo } from 'react';
import { DataGrid, type GridColDef, type GridRowParams, type GridRowSelectionModel } from '@mui/x-data-grid';
import { Box, Typography } from '@mui/material';
import Icon from '@mui/material/Icon';
import { useTreeNodes } from '../../api/hooks';
import { useExplorerStore } from '../../store/explorerStore';
import { getStatusColor } from '../../utils/nodeStatus';
import { resolveNodeIcon } from '../../utils/kindIcons';
import { ContextMenu, type ContextMenuItem } from '../common/ContextMenu';
import type { EsqTreeNodeDto } from '../../api/types';

interface ListViewProps {
  onDoubleClick: (node: EsqTreeNodeDto) => void;
  onContextMenu: (node: EsqTreeNodeDto, x: number, y: number) => void;
}

export const ListView: React.FC<ListViewProps> = ({ onDoubleClick, onContextMenu }) => {
  const { selectedNode, getKind, selectedListItemId, setSelectedListItemId } = useExplorerStore();
  const { data: children, isLoading } = useTreeNodes(selectedNode?.id);

  // Build columns from kind definition
  const parentKind = getKind(selectedNode?.kind ?? 0);

  const columns: GridColDef[] = useMemo(() => {
    const cols: GridColDef[] = [
      {
        field: 'icon',
        headerName: '',
        width: 40,
        sortable: false,
        renderCell: (params) => {
          const kind = getKind(params.row.kind);
          return <Icon baseClassName="material-icons-outlined" fontSize="small" sx={{ color: getStatusColor(params.row.statusCode) }}>
            {resolveNodeIcon(params.row.name, kind?.icon)}
          </Icon>;
        },
      },
      { field: 'name', headerName: 'Name', flex: 1, minWidth: 200 },
    ];

    // Add dynamic columns from kind listHeaders (skip name/desc — added statically)
    if (parentKind?.listHeaders) {
      parentKind.listHeaders.forEach(col => {
        if (col.columnDef !== 'name' && col.columnDef !== 'desc') {
          cols.push({
            field: col.columnDef,
            headerName: col.header,
            width: 150,
          });
        }
      });
    }

    cols.push({ field: 'desc', headerName: 'Description', flex: 1, minWidth: 150 });

    return cols;
  }, [parentKind, getKind]);

  const rows = useMemo(() => {
    // EsqTreeNodeDto already has 'id', which DataGrid uses as row ID
    return children || [];
  }, [children]);

  // Controlled row selection — survives data refetches
  const rowSelectionModel: GridRowSelectionModel = useMemo(
    () => (selectedListItemId ? [selectedListItemId] : []),
    [selectedListItemId],
  );

  const handleRowClick = useCallback((params: GridRowParams) => {
    setSelectedListItemId(String(params.row.id));
  }, [setSelectedListItemId]);

  const handleRowDoubleClick = useCallback((params: GridRowParams) => {
    setSelectedListItemId(String(params.row.id));
    const node = children?.find(n => n.id === params.row.id);
    if (node) onDoubleClick(node);
  }, [children, onDoubleClick, setSelectedListItemId]);

  const handleRowContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    const rowId = (e.currentTarget as HTMLElement).getAttribute('data-id');
    const node = children?.find(n => n.id === rowId);
    if (node) onContextMenu(node, e.clientX, e.clientY);
  }, [children, onContextMenu]);

  if (!selectedNode) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <Typography color="text.secondary">Select a node in the tree</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ height: '100%', width: '100%' }}>
      <DataGrid
        rows={rows}
        columns={columns}
        loading={isLoading}
        density="compact"
        pageSizeOptions={[50, 100]}
        initialState={{ pagination: { paginationModel: { pageSize: 50 } } }}
        disableColumnMenu
        rowSelectionModel={rowSelectionModel}
        onRowClick={handleRowClick}
        onRowDoubleClick={handleRowDoubleClick}
        slotProps={{
          row: {
            onContextMenu: handleRowContextMenu,
          },
        }}
        sx={{
          border: 'none',
          '& .MuiDataGrid-row:hover': { bgcolor: 'action.hover' },
          '& .MuiDataGrid-cell': { fontSize: '0.85rem' },
        }}
      />
    </Box>
  );
};
