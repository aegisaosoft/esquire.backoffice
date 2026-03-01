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
} from '@mui/material';
import type { EsqEntityField } from '../../api/types';

interface TabFieldProps {
  field: EsqEntityField;
  value: any;
  onChange: (name: string, value: any) => void;
  readOnly: boolean;
}

/**
 * Dynamic field renderer based on field type from entity dictionary.
 * Matches Angular's EsqTabFieldComponent behavior.
 */
export const TabField: React.FC<TabFieldProps> = ({ field, value, onChange, readOnly }) => {
  const isReadOnly = readOnly || (field.readwrite & 2) === 0;
  const displayValue = value ?? field.nullmeaning ?? '';

  switch (field.type) {
    case 'Flag':
      return (
        <FormControlLabel
          control={
            <Switch
              checked={displayValue === 'Y' || displayValue === true}
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
          fullWidth
          size="small"
          label={field.label}
          type="number"
          value={displayValue}
          onChange={(e) => onChange(field.name, e.target.value)}
          slotProps={{ input: { readOnly: isReadOnly } }}
          helperText={field.tooltip || undefined}
          sx={{ mb: 1 }}
        />
      );

    case 'Datetime':
      return (
        <TextField
          fullWidth
          size="small"
          label={field.label}
          type="datetime-local"
          value={displayValue}
          onChange={(e) => onChange(field.name, e.target.value)}
          slotProps={{ input: { readOnly: isReadOnly }, inputLabel: { shrink: true } }}
          sx={{ mb: 1 }}
        />
      );

    case 'Href':
      return (
        <TextField
          fullWidth
          size="small"
          label={field.label}
          value={displayValue}
          onChange={(e) => onChange(field.name, e.target.value)}
          slotProps={{ input: { readOnly: isReadOnly } }}
          helperText={
            displayValue && !isReadOnly ? (
              <Link href={displayValue} target="_blank" rel="noopener">{displayValue}</Link>
            ) : undefined
          }
          sx={{ mb: 1 }}
        />
      );

    case 'String':
    default:
      return (
        <TextField
          fullWidth
          size="small"
          label={field.label}
          value={displayValue}
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
