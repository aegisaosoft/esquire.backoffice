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
import React, { useState, useCallback } from 'react';
import { Box, ButtonBase, Typography, Button, IconButton, Tooltip } from '@mui/material';
import { Logout, PushPin, PushPinOutlined, ChevronRight } from '@mui/icons-material';
import { useAuthContext } from '../../contexts/AuthContext';
import {
  getNavbarPlugins,
  getToolbarPlugins,
  getDefaultPlugin,
  getSortedPlugins,
} from '../../plugins/registry';

/** Width of the left navigation bar (px). */
const NAV_WIDTH = 144;

/** Height of the app banner (px). */
const BANNER_HEIGHT = 40;

/** Height of the top toolbar (px). */
const TOOLBAR_HEIGHT = 36;

/**
 * Main application shell.
 *
 * All plugins are independent links. Clicking activates the plugin
 * and renders its content in the main area.
 *
 * The left nav bar can be pinned (always visible) or floating
 * (appears on hover over the left edge, hides when mouse leaves).
 */
export const MainShell: React.FC = () => {
  const { logout } = useAuthContext();
  const navPlugins = getNavbarPlugins();
  const toolbarPlugins = getToolbarPlugins();
  const allPlugins = getSortedPlugins();
  const defaultPlugin = getDefaultPlugin();
  const [activePluginId, setActivePluginId] = useState(defaultPlugin.id);
  const [navPinned, setNavPinned] = useState(true);
  const [navHover, setNavHover] = useState(false);

  const activePlugin = allPlugins.find(p => p.id === activePluginId) ?? allPlugins[0];
  const ActiveContent = activePlugin.content;

  const hasToolbar = toolbarPlugins.length > 0;
  const navVisible = navPinned || navHover;

  const handleNavMouseEnter = useCallback(() => {
    if (!navPinned) setNavHover(true);
  }, [navPinned]);

  const handleNavMouseLeave = useCallback(() => {
    if (!navPinned) setNavHover(false);
  }, [navPinned]);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      {/* ─── App Banner ─── */}
      <Box
        sx={{
          height: BANNER_HEIGHT,
          flexShrink: 0,
          bgcolor: '#fff',
          borderBottom: 1,
          borderColor: 'divider',
          display: 'flex',
          alignItems: 'center',
          px: 2,
          gap: 1,
        }}
      >
        <img src="/favicon.png" alt="Esquire" style={{ width: 30, height: 30 }} />
        <Typography
          variant="subtitle1"
          sx={{
            color: 'text.primary',
            fontWeight: 700,
            letterSpacing: '0.04em',
            flex: 1,
          }}
        >
          Esquire Office
        </Typography>
        <Tooltip title="Logout">
          <IconButton size="small" onClick={logout} sx={{ color: 'text.secondary' }}>
            <Logout fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>

      {/* ─── Top Toolbar (full width) ─── */}
      {hasToolbar && (
        <Box
          sx={{
            height: TOOLBAR_HEIGHT,
            flexShrink: 0,
            bgcolor: 'grey.100',
            borderBottom: 1,
            borderColor: 'divider',
            display: 'flex',
            alignItems: 'center',
            px: 1,
            gap: 0.5,
          }}
        >
          {toolbarPlugins.map(plugin => (
            <Button
              key={plugin.id}
              size="small"
              variant={activePluginId === plugin.id ? 'contained' : 'text'}
              onClick={() => setActivePluginId(plugin.id)}
              sx={{
                textTransform: 'none',
                minWidth: 'auto',
                px: 1.5,
                py: 0.25,
                fontSize: '0.8rem',
              }}
            >
              {plugin.label}
            </Button>
          ))}
        </Box>
      )}

      {/* ─── Nav Bar + Content ─── */}
      <Box sx={{ flex: 1, display: 'flex', overflow: 'hidden', position: 'relative' }}>
        {/* Toggle button — visible when navbar is unpinned and hidden */}
        {!navPinned && !navHover && (
          <Tooltip title="Show navbar" placement="right">
            <IconButton
              size="small"
              onClick={() => setNavHover(true)}
              onMouseEnter={handleNavMouseEnter}
              sx={{
                position: 'absolute',
                left: 0,
                top: 4,
                zIndex: 20,
                bgcolor: 'primary.dark',
                color: 'rgba(255,255,255,0.7)',
                borderRadius: '0 4px 4px 0',
                width: 20,
                height: 32,
                '&:hover': { bgcolor: 'primary.main', color: 'primary.contrastText' },
              }}
            >
              <ChevronRight sx={{ fontSize: 16 }} />
            </IconButton>
          </Tooltip>
        )}

        {/* ─── Left Nav Bar ─── */}
        <Box
          onMouseEnter={handleNavMouseEnter}
          onMouseLeave={handleNavMouseLeave}
          sx={{
            width: navVisible ? NAV_WIDTH : 0,
            flexShrink: 0,
            bgcolor: 'primary.dark',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            overflow: 'hidden',
            transition: 'width 0.2s ease',
            // When unpinned and visible, float over content
            ...(!navPinned && navHover ? {
              position: 'absolute',
              left: 0,
              top: 0,
              bottom: 0,
              zIndex: 10,
              width: NAV_WIDTH,
              boxShadow: '4px 0 12px rgba(0,0,0,0.3)',
            } : {}),
          }}
        >
          {/* ─── Pin button ─── */}
          <Box sx={{ width: '100%', display: 'flex', justifyContent: 'flex-end', px: 0.5, pt: 0.5 }}>
            <Tooltip title={navPinned ? 'Unpin navbar' : 'Pin navbar'} placement="right">
              <IconButton
                size="small"
                onClick={() => setNavPinned(p => !p)}
                sx={{ color: 'rgba(255,255,255,0.6)', '&:hover': { color: 'primary.contrastText' } }}
              >
                {navPinned ? <PushPin sx={{ fontSize: 16 }} /> : <PushPinOutlined sx={{ fontSize: 16 }} />}
              </IconButton>
            </Tooltip>
          </Box>

          {/* ─── Plugin links ─── */}
          {navPlugins.map(plugin => {
            const isActive = activePluginId === plugin.id;
            return (
              <ButtonBase
                key={plugin.id}
                onClick={() => setActivePluginId(plugin.id)}
                sx={{
                  width: '100%',
                  py: 0.75,
                  px: 0.5,
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  bgcolor: isActive ? 'rgba(255,255,255,0.15)' : 'transparent',
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' },
                }}
              >
                <Typography
                  variant="caption"
                  noWrap
                  sx={{
                    color: isActive ? 'primary.contrastText' : 'rgba(255,255,255,0.5)',
                    fontSize: '0.7rem',
                    fontWeight: isActive ? 700 : 400,
                    textTransform: 'uppercase',
                    letterSpacing: '0.02em',
                    lineHeight: 1.2,
                    textAlign: 'center',
                  }}
                >
                  {plugin.label}
                </Typography>
              </ButtonBase>
            );
          })}
        </Box>

        {/* ─── Plugin Content Area ─── */}
        <Box sx={{ flex: 1, overflow: 'hidden' }}>
          {ActiveContent && <ActiveContent />}
        </Box>
      </Box>

      {/* ─── Footer ─── */}
      <Box
        sx={{
          flexShrink: 0,
          borderTop: 1,
          borderColor: 'divider',
          display: 'flex',
          justifyContent: 'flex-end',
          alignItems: 'center',
          px: 2,
          py: 0.5,
        }}
      >
        <Typography variant="caption" sx={{ color: 'text.disabled', fontSize: '0.7rem' }}>
          Copyright© 2001, 2026 mir0n&co & Aegis AO Soft
        </Typography>
      </Box>
    </Box>
  );
};
