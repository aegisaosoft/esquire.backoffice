import React, { useCallback, useRef, useState } from 'react';
import { Box } from '@mui/material';

interface ResizablePanelProps {
  left: React.ReactNode;
  right: React.ReactNode;
  initialWidth?: number; // initial left panel width in px
  minWidth?: number;
  maxWidth?: number;
}

export const ResizablePanel: React.FC<ResizablePanelProps> = ({
  left,
  right,
  initialWidth = 320,
  minWidth = 200,
  maxWidth = 600,
}) => {
  const [leftWidth, setLeftWidth] = useState(initialWidth);
  const dragging = useRef(false);

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    dragging.current = true;

    const onMouseMove = (ev: MouseEvent) => {
      if (!dragging.current) return;
      const newWidth = Math.min(maxWidth, Math.max(minWidth, ev.clientX));
      setLeftWidth(newWidth);
    };

    const onMouseUp = () => {
      dragging.current = false;
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  }, [minWidth, maxWidth]);

  return (
    <Box sx={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
      <Box sx={{ width: leftWidth, flexShrink: 0, overflow: 'auto' }}>
        {left}
      </Box>
      <Box
        onMouseDown={onMouseDown}
        sx={{
          width: 4,
          cursor: 'col-resize',
          bgcolor: 'divider',
          '&:hover': { bgcolor: 'primary.main' },
          flexShrink: 0,
        }}
      />
      <Box sx={{ flex: 1, overflow: 'auto' }}>
        {right}
      </Box>
    </Box>
  );
};
