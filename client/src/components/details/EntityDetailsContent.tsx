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
  /** Double-click on a sub-entity item (kind, entityId) */
  onItemOpen?: (kind: number, entityId: string) => void;
  /** Loading state */
  loading?: boolean;
}

/**
 * Normalise a single raw field definition into EsqEntityField.
 * Backend may send sort/readwrite as strings — coerce to numbers.
 */
function normaliseField(raw: any): EsqEntityField {
  return {
    ...raw,
    sort: typeof raw.sort === 'number' ? raw.sort : parseInt(raw.sort, 10) || 0,
    readwrite: typeof raw.readwrite === 'number' ? raw.readwrite : parseInt(raw.readwrite, 10) || 0,
  };
}

/**
 * Parse arbitrary dictionary response into a uniform EsqEntityLayer[].
 *
 * Supported backend formats:
 *  1. Array of EsqEntityLayerDto: [{ layer, title, fields: [...] }, ...]
 *  2. Flat array of fields with optional `layer` / `layerTitle` props
 *  3. Object with `layers` array
 *  4. Object with `fields` array (single-layer fallback)
 *  5. Any other shape → empty
 *
 * Tabs/layers are entirely backend-driven and may differ per entity kind.
 */
function parseDictionary(dictData: any): EsqEntityLayer[] {
  if (!dictData) return [];

  // ── Case 1 & 2: Array ──
  if (Array.isArray(dictData)) {
    if (dictData.length === 0) return [];

    const first = dictData[0];

    // Case 1: Array of layer DTOs — each element has { layer, title, fields }
    if (Array.isArray(first?.fields)) {
      return (dictData as EsqEntityLayerDto[]).map(l => ({
        name: l.title || `Layer ${l.layer ?? 0}`,
        fields: (l.fields || []).map(normaliseField).sort((a, b) => a.sort - b.sort),
      }));
    }

    // Case 2: Flat array of field definitions — group by layer / layerTitle
    const groups = new Map<string, EsqEntityField[]>();
    for (const raw of dictData) {
      const layerKey = raw.layerTitle || raw.layer || 'General';
      const key = typeof layerKey === 'number' ? `Layer ${layerKey}` : String(layerKey);
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(normaliseField(raw));
    }
    return Array.from(groups.entries()).map(([name, fields]) => ({
      name,
      fields: fields.sort((a, b) => a.sort - b.sort),
    }));
  }

  // ── Case 3 & 4: Object ──
  if (typeof dictData === 'object') {
    // Case 3: { layers: [...] }
    if (Array.isArray(dictData.layers)) {
      return parseDictionary(dictData.layers);
    }
    // Case 4: { fields: [...] }
    if (Array.isArray(dictData.fields)) {
      return [{ name: 'General', fields: dictData.fields.map(normaliseField).sort((a: EsqEntityField, b: EsqEntityField) => a.sort - b.sort) }];
    }
  }

  return [];
}

/**
 * Universal entity details renderer.
 * Parses dictionary into layers/tabs and renders fields via TabField.
 * Works for ALL entity types — the dictionary drives the UI.
 * Tabs and fields are fully dynamic; new kinds/tabs added on the backend
 * will render automatically without frontend changes.
 */
export const EntityDetailsContent: React.FC<EntityDetailsContentProps> = ({
  entity,
  dictData,
  editedFields,
  editMode,
  onFieldChange,
  onItemOpen,
  loading,
}) => {
  const [activeTab, setActiveTab] = useState(0);

  const layers = useMemo(() => parseDictionary(dictData), [dictData]);

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

  // Clamp activeTab in case layers changed dynamically
  const safeTab = Math.min(activeTab, layers.length - 1);

  return (
    <>
      {layers.length > 1 && (
        <Tabs
          value={safeTab}
          onChange={(_, v) => setActiveTab(v)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{ mb: 2 }}
        >
          {layers.map((layer, i) => (
            <Tab key={i} label={layer.name} />
          ))}
        </Tabs>
      )}

      <Box sx={{ px: 1 }}>
        {layers[safeTab]?.fields.map(field => (
          <TabField
            key={field.name}
            field={field}
            value={getFieldValue(field.name)}
            onChange={onFieldChange}
            onItemOpen={onItemOpen}
            readOnly={!editMode}
          />
        ))}
      </Box>
    </>
  );
};
