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
import {
  TextField,
  Switch,
  FormControlLabel,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Link,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  Chip,
  Box,
} from '@mui/material';
import type { EsqEntityField } from '../../api/types';

interface TabFieldProps {
  field: EsqEntityField;
  value: any;
  onChange: (name: string, value: any) => void;
  /** Double-click on a sub-entity item → navigate into its details (kind, entityId) */
  onItemOpen?: (kind: number, entityId: string) => void;
  readOnly: boolean;
}

/* ─── Helpers ─── */

/** Safely coerce readwrite to a number (backend may send string or number) */
function rw(field: EsqEntityField): number {
  const v = field.readwrite;
  if (typeof v === 'number') return v;
  if (typeof v === 'string') return parseInt(v, 10) || 0;
  return 0;
}

/** Convert any value to a safe display string (never [object Object]) */
function toDisplayString(v: any, nullmeaning?: string): string {
  if (v == null) return nullmeaning ?? '';
  if (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean') return String(v);
  // Object with name → use name
  if (typeof v === 'object' && !Array.isArray(v)) {
    if (v.name != null) return String(v.name);
    if (v.id != null) return String(v.id);
    if (v.value != null) return String(v.value);
    // Last resort: compact JSON
    try { return JSON.stringify(v); } catch { return ''; }
  }
  // Array → join display values
  if (Array.isArray(v)) {
    return v.map(item => toDisplayString(item)).join(', ');
  }
  return String(v);
}

/** Check if value is an array of objects (table-renderable) */
function isObjectArray(v: any): v is Record<string, any>[] {
  return Array.isArray(v) && v.length > 0 && typeof v[0] === 'object' && v[0] !== null;
}

/** Collect column keys from an array of objects */
function collectColumns(arr: Record<string, any>[]): string[] {
  const keys = new Set<string>();
  for (const obj of arr) {
    for (const k of Object.keys(obj)) keys.add(k);
  }
  return Array.from(keys);
}

/**
 * Dynamic field renderer based on field type from entity dictionary.
 * Handles all value types: primitives, objects, arrays of objects.
 * Works for ANY entity kind — the dictionary drives the UI.
 */
export const TabField: React.FC<TabFieldProps> = ({ field, value, onChange, onItemOpen, readOnly }) => {
  const isReadOnly = readOnly || (rw(field) & 2) === 0;

  // ── Array of objects → render as a simple list showing display value ──
  if (isObjectArray(value)) {
    return (
      <Box sx={{ mb: 2 }}>
        <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
          {field.label}
        </Typography>
        <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 240 }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 600, py: 0.5, fontSize: '0.8rem' }}>
                  {field.label}
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {value.map((row: Record<string, any>, i: number) => {
                const canOpen = onItemOpen && row.id != null && row.kind != null;
                return (
                  <TableRow
                    key={row.id ?? i}
                    hover
                    onDoubleClick={canOpen ? () => onItemOpen(row.kind, String(row.id)) : undefined}
                    sx={canOpen ? { cursor: 'pointer' } : undefined}
                  >
                    <TableCell sx={{ py: 0.5, fontSize: '0.8rem' }}>
                      {toDisplayString(row)}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    );
  }

  // ── Array of primitives → render as chips ──
  if (Array.isArray(value)) {
    return (
      <Box sx={{ mb: 1 }}>
        <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
          {field.label}
        </Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
          {value.length === 0 && (
            <Typography variant="body2" color="text.secondary">{field.nullmeaning || '—'}</Typography>
          )}
          {value.map((item, i) => (
            <Chip key={i} label={toDisplayString(item)} size="small" variant="outlined" />
          ))}
        </Box>
      </Box>
    );
  }

  // ── Single object (non-array) → render its properties as key-value pairs ──
  if (value != null && typeof value === 'object' && !Array.isArray(value)) {
    const entries = Object.entries(value).filter(([, v]) => v != null);
    if (entries.length === 0) {
      return (
        <TextField
          fullWidth size="small" label={field.label}
          value={field.nullmeaning || ''} slotProps={{ input: { readOnly: true } }}
          sx={{ mb: 1 }}
        />
      );
    }
    // Single property → inline display
    if (entries.length <= 2) {
      return (
        <TextField
          fullWidth size="small" label={field.label}
          value={toDisplayString(value)} slotProps={{ input: { readOnly: true } }}
          helperText={field.tooltip || undefined} sx={{ mb: 1 }}
        />
      );
    }
    // Multiple properties → mini key-value table
    return (
      <Box sx={{ mb: 2 }}>
        <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
          {field.label}
        </Typography>
        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableBody>
              {entries.map(([k, v]) => (
                <TableRow key={k}>
                  <TableCell sx={{ fontWeight: 600, py: 0.5, fontSize: '0.8rem', width: '30%' }}>{k}</TableCell>
                  <TableCell sx={{ py: 0.5, fontSize: '0.8rem' }}>{toDisplayString(v)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    );
  }

  // ── Primitive values below ──
  const displayValue = value ?? field.nullmeaning ?? '';

  switch (field.type) {
    case 'Flag':
      return (
        <FormControlLabel
          control={
            <Switch
              checked={displayValue === 'Y' || displayValue === true || displayValue === '1'}
              onChange={(e) => onChange(field.name, e.target.checked ? 'Y' : 'N')}
              disabled={isReadOnly}
              size="small"
            />
          }
          label={field.label}
          sx={{ mb: 1 }}
        />
      );

    case 'List':
      return (
        <FormControl fullWidth size="small" sx={{ mb: 1 }}>
          <InputLabel>{field.label}</InputLabel>
          <Select
            value={displayValue}
            label={field.label}
            onChange={(e) => onChange(field.name, e.target.value)}
            disabled={isReadOnly}
          >
            {field.nullable === 'Y' && <MenuItem value=""><em>{field.nullmeaning || 'None'}</em></MenuItem>}
            {field.listvalues?.map(v => (
              <MenuItem key={v} value={v}>{v}</MenuItem>
            ))}
          </Select>
        </FormControl>
      );

    case 'Integer':
    case 'Number':
      return (
        <TextField
          fullWidth size="small" label={field.label} type="number"
          value={displayValue}
          onChange={(e) => onChange(field.name, e.target.value)}
          slotProps={{ input: { readOnly: isReadOnly } }}
          helperText={field.tooltip || undefined} sx={{ mb: 1 }}
        />
      );

    case 'Datetime':
      return (
        <TextField
          fullWidth size="small" label={field.label} type="datetime-local"
          value={displayValue}
          onChange={(e) => onChange(field.name, e.target.value)}
          slotProps={{ input: { readOnly: isReadOnly }, inputLabel: { shrink: true } }}
          sx={{ mb: 1 }}
        />
      );

    case 'Href':
      return (
        <TextField
          fullWidth size="small" label={field.label}
          value={toDisplayString(displayValue)}
          onChange={(e) => onChange(field.name, e.target.value)}
          slotProps={{ input: { readOnly: isReadOnly } }}
          helperText={
            displayValue && !isReadOnly ? (
              <Link href={String(displayValue)} target="_blank" rel="noopener">{String(displayValue)}</Link>
            ) : undefined
          }
          sx={{ mb: 1 }}
        />
      );

    case 'Image':
      return (
        <Box sx={{ mb: 1 }}>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
            {field.label}
          </Typography>
          {displayValue ? (
            <img src={String(displayValue)} alt={field.label} style={{ maxWidth: '100%', maxHeight: 200 }} />
          ) : (
            <Typography variant="body2" color="text.secondary">{field.nullmeaning || '—'}</Typography>
          )}
        </Box>
      );

    case 'String':
    case 'Text':
    default:
      return (
        <TextField
          fullWidth size="small" label={field.label}
          value={toDisplayString(displayValue)}
          onChange={(e) => onChange(field.name, e.target.value)}
          slotProps={{ input: { readOnly: isReadOnly } }}
          helperText={field.tooltip || undefined}
          multiline={field.type === 'Text'}
          rows={field.type === 'Text' ? 3 : undefined}
          sx={{ mb: 1 }}
        />
      );
  }
};
