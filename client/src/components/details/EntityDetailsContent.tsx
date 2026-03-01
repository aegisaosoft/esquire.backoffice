import React, { useState, useCallback, useMemo } from 'react';
import { Tabs, Tab, Box, CircularProgress, Typography } from '@mui/material';
import { TabField } from '../fields/TabField';
import type { EsqEntityField, EsqEntityLayer, EsqEntityLayerDto } from '../../api/types';

interface EntityDetailsContentProps {
  /** Raw entity data (key-value) */
  entity: Record<string, any> | null | undefined;
  /** Raw dictionary response from backend */
  dictData: any;
  /** Currently edited fields (overrides entity values) */
  editedFields: Record<string, any>;
  /** Whether fields are editable */
  editMode: boolean;
  /** Field change callback */
  onFieldChange: (name: string, value: any) => void;
  /** Loading state */
  loading?: boolean;
}

/**
 * Universal entity details renderer.
 * Parses dictionary into layers/tabs and renders fields via TabField.
 * Works for ALL entity types — the dictionary drives the UI.
 */
export const EntityDetailsContent: React.FC<EntityDetailsContentProps> = ({
  entity,
  dictData,
  editedFields,
  editMode,
  onFieldChange,
  loading,
}) => {
  const [activeTab, setActiveTab] = useState(0);

  // Parse dictionary into layers (tabs)
  const layers: EsqEntityLayer[] = useMemo(() => {
    if (!dictData) return [];

    if (Array.isArray(dictData)) {
      // Backend returns List<EsqEntityLayerDto> — each element has { layer, title, fields }
      if (dictData.length > 0 && Array.isArray((dictData[0] as EsqEntityLayerDto).fields)) {
        return (dictData as EsqEntityLayerDto[]).map(l => ({
          name: l.title || `Layer ${l.layer}`,
          fields: (l.fields || []).sort((a, b) => a.sort - b.sort),
        }));
      }
      // Fallback: flat list of fields — group by layer name
      const groups = new Map<string, EsqEntityField[]>();
      for (const f of dictData as EsqEntityField[]) {
        const layer = (f as any).layer || 'General';
        if (!groups.has(layer)) groups.set(layer, []);
        groups.get(layer)!.push(f);
      }
      return Array.from(groups.entries()).map(([name, fields]) => ({
        name,
        fields: fields.sort((a, b) => a.sort - b.sort),
      }));
    }

    // Already structured as layers object
    return dictData.layers || [{ name: 'General', fields: dictData.fields || [] }];
  }, [dictData]);

  // Get field value: edited value takes priority, then entity value
  const getFieldValue = useCallback(
    (fieldName: string) => {
      if (fieldName in editedFields) return editedFields[fieldName];
      return entity?.[fieldName];
    },
    [editedFields, entity],
  );

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!layers.length) {
    return (
      <Box sx={{ p: 2 }}>
        <Typography color="text.secondary">No fields available for this entity type.</Typography>
      </Box>
    );
  }

  return (
    <>
      {layers.length > 1 && (
        <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)} sx={{ mb: 2 }}>
          {layers.map((layer, i) => (
            <Tab key={i} label={layer.name} />
          ))}
        </Tabs>
      )}

      <Box sx={{ px: 1 }}>
        {layers[activeTab]?.fields.map(field => (
          <TabField
            key={field.name}
            field={field}
            value={getFieldValue(field.name)}
            onChange={onFieldChange}
            readOnly={!editMode}
          />
        ))}
      </Box>
    </>
  );
};
