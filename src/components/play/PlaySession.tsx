import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Map as MapIcon,
  MessageSquare,
  Dices,
  FileText,
  Settings,
  Users,
  Crown,
  Wifi,
  WifiOff,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Palette,
  PencilLine,
} from 'lucide-react';
import { MapCanvas } from '../map/MapCanvas';
import { ChatPanel } from '../chat/ChatPanel';
import { DicePanel } from '../dice/DicePanel';
import { NotepadPanel } from '../shared/NotepadPanel';
import { GMPanel } from '../gm/GMPanel';
import { DrawingTools } from '../map/DrawingTools';
import { InventoryPanel } from '../inventory/InventoryPanel';
import { InitiativePanel } from '../initiative/InitiativePanel';
import { Button } from '../shared/Button';
import { useSessionStore, useIsGM } from '../../stores/sessionStore';
import { useMapStore } from '../../stores/mapStore';
import { useSession } from '../../hooks/useSession';
import { useMap } from '../../hooks/useMap';
import { useToast } from '../shared/Toast';

type SideTab = 'chat' | 'dice' | 'initiative' | 'notes' | 'inventory' | 'draw' | 'settings';
type ColorScheme =
  | 'storm'
  | 'dawn'
  | 'charcoal'
  | 'forest'
  | 'sky'
  | 'slate'
  | 'rose';

const COLOR_SCHEMES: Record<
  ColorScheme,
  {
    label: string;
    appBg: string;
    headerBg: string;
    headerBorder: string;
    headerText: string;
    headerMuted: string;
    headerSubtle: string;
    badgeBg: string;
    sidePanelBg: string;
    sidePanelBorder: string;
    overlayBg: string;
    overlayBorder: string;
    tabActive: string;
    tabInactive: string;
    buttonActive: string;
    settingsPanelBg: string;
    settingsPanelBorder: string;
    settingsInputBg: string;
    settingsInputBorder: string;
    settingsInputText: string;
    settingsInputMuted: string;
  }
> = {
  storm: {
    label: 'Stormlight',
    appBg: 'bg-storm-950',
    headerBg: 'bg-storm-900',
    headerBorder: 'border-storm-700',
    headerText: 'text-storm-100',
    headerMuted: 'text-storm-300',
    headerSubtle: 'text-storm-400',
    badgeBg: 'bg-storm-800',
    sidePanelBg: 'bg-storm-900',
    sidePanelBorder: 'border-storm-700',
    overlayBg: 'bg-storm-900/90',
    overlayBorder: 'border-storm-700',
    tabActive: 'text-storm-100 border-storm-400 bg-storm-800/50',
    tabInactive: 'text-storm-400 border-transparent hover:text-storm-200 hover:bg-storm-800/30',
    buttonActive: 'bg-storm-800',
    settingsPanelBg: 'bg-storm-950',
    settingsPanelBorder: 'border-storm-800',
    settingsInputBg: 'bg-storm-900',
    settingsInputBorder: 'border-storm-700',
    settingsInputText: 'text-storm-100',
    settingsInputMuted: 'text-storm-400',
  },
  dawn: {
    label: 'Dawn',
    appBg: 'bg-slate-100',
    headerBg: 'bg-white',
    headerBorder: 'border-slate-200',
    headerText: 'text-slate-900',
    headerMuted: 'text-slate-600',
    headerSubtle: 'text-slate-500',
    badgeBg: 'bg-slate-100',
    sidePanelBg: 'bg-white',
    sidePanelBorder: 'border-slate-200',
    overlayBg: 'bg-white/90',
    overlayBorder: 'border-slate-200',
    tabActive: 'text-slate-900 border-slate-400 bg-slate-200/60',
    tabInactive: 'text-slate-500 border-transparent hover:text-slate-700 hover:bg-slate-100',
    buttonActive: 'bg-slate-200',
    settingsPanelBg: 'bg-slate-50',
    settingsPanelBorder: 'border-slate-200',
    settingsInputBg: 'bg-white',
    settingsInputBorder: 'border-slate-300',
    settingsInputText: 'text-slate-900',
    settingsInputMuted: 'text-slate-600',
  },
  charcoal: {
    label: 'Charcoal',
    appBg: 'bg-zinc-950',
    headerBg: 'bg-zinc-900',
    headerBorder: 'border-zinc-700',
    headerText: 'text-zinc-100',
    headerMuted: 'text-zinc-400',
    headerSubtle: 'text-zinc-500',
    badgeBg: 'bg-zinc-800',
    sidePanelBg: 'bg-zinc-900',
    sidePanelBorder: 'border-zinc-700',
    overlayBg: 'bg-zinc-900/90',
    overlayBorder: 'border-zinc-700',
    tabActive: 'text-zinc-100 border-zinc-400 bg-zinc-800/50',
    tabInactive: 'text-zinc-400 border-transparent hover:text-zinc-200 hover:bg-zinc-800/30',
    buttonActive: 'bg-zinc-800',
    settingsPanelBg: 'bg-zinc-950',
    settingsPanelBorder: 'border-zinc-800',
    settingsInputBg: 'bg-zinc-900',
    settingsInputBorder: 'border-zinc-700',
    settingsInputText: 'text-zinc-100',
    settingsInputMuted: 'text-zinc-400',
  },
  forest: {
    label: 'Forest',
    appBg: 'bg-emerald-950',
    headerBg: 'bg-emerald-900',
    headerBorder: 'border-emerald-700',
    headerText: 'text-emerald-100',
    headerMuted: 'text-emerald-300',
    headerSubtle: 'text-emerald-400',
    badgeBg: 'bg-emerald-800',
    sidePanelBg: 'bg-emerald-900',
    sidePanelBorder: 'border-emerald-700',
    overlayBg: 'bg-emerald-900/90',
    overlayBorder: 'border-emerald-700',
    tabActive: 'text-emerald-100 border-emerald-400 bg-emerald-800/50',
    tabInactive: 'text-emerald-300 border-transparent hover:text-emerald-200 hover:bg-emerald-800/30',
    buttonActive: 'bg-emerald-800',
    settingsPanelBg: 'bg-emerald-950',
    settingsPanelBorder: 'border-emerald-800',
    settingsInputBg: 'bg-emerald-900',
    settingsInputBorder: 'border-emerald-700',
    settingsInputText: 'text-emerald-100',
    settingsInputMuted: 'text-emerald-400',
  },
  sky: {
    label: 'Sky',
    appBg: 'bg-sky-950',
    headerBg: 'bg-sky-900',
    headerBorder: 'border-sky-700',
    headerText: 'text-sky-100',
    headerMuted: 'text-sky-300',
    headerSubtle: 'text-sky-400',
    badgeBg: 'bg-sky-800',
    sidePanelBg: 'bg-sky-900',
    sidePanelBorder: 'border-sky-700',
    overlayBg: 'bg-sky-900/90',
    overlayBorder: 'border-sky-700',
    tabActive: 'text-sky-100 border-sky-400 bg-sky-800/50',
    tabInactive: 'text-sky-300 border-transparent hover:text-sky-200 hover:bg-sky-800/30',
    buttonActive: 'bg-sky-800',
    settingsPanelBg: 'bg-sky-950',
    settingsPanelBorder: 'border-sky-800',
    settingsInputBg: 'bg-sky-900',
    settingsInputBorder: 'border-sky-700',
    settingsInputText: 'text-sky-100',
    settingsInputMuted: 'text-sky-400',
  },
  slate: {
    label: 'Slate',
    appBg: 'bg-slate-950',
    headerBg: 'bg-slate-900',
    headerBorder: 'border-slate-700',
    headerText: 'text-slate-100',
    headerMuted: 'text-slate-300',
    headerSubtle: 'text-slate-400',
    badgeBg: 'bg-slate-800',
    sidePanelBg: 'bg-slate-900',
    sidePanelBorder: 'border-slate-700',
    overlayBg: 'bg-slate-900/90',
    overlayBorder: 'border-slate-700',
    tabActive: 'text-slate-100 border-slate-400 bg-slate-800/50',
    tabInactive: 'text-slate-300 border-transparent hover:text-slate-200 hover:bg-slate-800/30',
    buttonActive: 'bg-slate-800',
    settingsPanelBg: 'bg-slate-950',
    settingsPanelBorder: 'border-slate-800',
    settingsInputBg: 'bg-slate-900',
    settingsInputBorder: 'border-slate-700',
    settingsInputText: 'text-slate-100',
    settingsInputMuted: 'text-slate-400',
  },
  rose: {
    label: 'Roshar',
    appBg: 'bg-rose-950',
    headerBg: 'bg-rose-900',
    headerBorder: 'border-rose-700',
    headerText: 'text-rose-100',
    headerMuted: 'text-rose-300',
    headerSubtle: 'text-rose-400',
    badgeBg: 'bg-rose-800',
    sidePanelBg: 'bg-rose-900',
    sidePanelBorder: 'border-rose-700',
    overlayBg: 'bg-rose-900/90',
    overlayBorder: 'border-rose-700',
    tabActive: 'text-rose-100 border-rose-400 bg-rose-800/50',
    tabInactive: 'text-rose-300 border-transparent hover:text-rose-200 hover:bg-rose-800/30',
    buttonActive: 'bg-rose-800',
    settingsPanelBg: 'bg-rose-950',
    settingsPanelBorder: 'border-rose-800',
    settingsInputBg: 'bg-rose-900',
    settingsInputBorder: 'border-rose-700',
    settingsInputText: 'text-rose-100',
    settingsInputMuted: 'text-rose-400',
  },
};

export const PlaySession: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const session = useSessionStore((state) => state.session);
  const currentUser = useSessionStore((state) => state.currentUser);
  const connectionStatus = useSessionStore((state) => state.connectionStatus);
  const players = useSessionStore((state) => state.players);
  const activeMap = useMapStore((state) => state.activeMap);
  const drawingData = useMapStore((state) => state.drawingData);
  const isGM = useIsGM();
  const { leaveSession, claimGM, releaseGM } = useSession();
  const { updateDrawingData } = useMap();

  const [sideTab, setSideTab] = useState<SideTab>('chat');
  const [showGMPanel, setShowGMPanel] = useState(false);
  const [isPlayerPanelCollapsed, setIsPlayerPanelCollapsed] = useState(() => {
    const stored = localStorage.getItem('stormlight-player-panel-collapsed');
    return stored === 'true';
  });
  const [colorScheme, setColorScheme] = useState<ColorScheme>(() => {
    const stored = localStorage.getItem('stormlight-color-scheme') as ColorScheme | null;
    return stored && stored in COLOR_SCHEMES ? stored : 'storm';
  });

  useEffect(() => {
    localStorage.setItem('stormlight-player-panel-collapsed', String(isPlayerPanelCollapsed));
  }, [isPlayerPanelCollapsed]);

  useEffect(() => {
    localStorage.setItem('stormlight-color-scheme', colorScheme);
  }, [colorScheme]);

  useEffect(() => {
    // Open GM panel by default for GM
    if (isGM) {
      setShowGMPanel(true);
    }
  }, [isGM]);

  if (!session || !currentUser) {
    return null;
  }

  const handleLeave = async () => {
    await leaveSession();
    navigate('/');
  };

  const handleClaimGM = async () => {
    const confirmed = confirm(
      'You are about to assume GM permissions. Only do this if you are the GM. Proceed?'
    );
    if (!confirmed) return;

    const result = await claimGM();
    if (result.success) {
      showToast('You are now the GM!', 'success');
    } else {
      showToast(result.error || 'Failed to claim GM', 'error');
    }
  };

  const handleReleaseGM = async () => {
    const result = await releaseGM();
    if (result.success) {
      showToast('GM role released', 'info');
    } else {
      showToast(result.error || 'Failed to release GM', 'error');
    }
  };

  const handleClearPlayerDrawings = async () => {
    if (!activeMap) return;
    const confirmed = confirm('Clear all player drawings on this map?');
    if (!confirmed) return;

    const remainingDrawings = drawingData.filter((drawing) => drawing.authorRole !== 'player');
    const result = await updateDrawingData(activeMap.id, remainingDrawings);
    if (result.success) {
      showToast('Player drawings cleared', 'success');
    } else {
      showToast(result.error || 'Failed to clear drawings', 'error');
    }
  };

  const scheme = COLOR_SCHEMES[colorScheme];

  return (
    <div className={`h-screen flex flex-col ${scheme.appBg}`}>
      {/* Header */}
      <header
        className={`flex-shrink-0 h-12 ${scheme.headerBg} border-b ${scheme.headerBorder} px-4 flex items-center justify-between`}
      >
        <div className="flex items-center gap-4">
          <h1 className={`font-semibold ${scheme.headerText}`}>{session.name}</h1>
          <span className={`text-sm font-mono ${scheme.headerSubtle} ${scheme.badgeBg} px-2 py-0.5 rounded`}>
            {session.code}
          </span>
          {activeMap && (
            <span className={`text-sm ${scheme.headerMuted} flex items-center gap-1`}>
              <MapIcon className="w-4 h-4" />
              {activeMap.name}
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          {/* Connection status */}
          <span
            className={`flex items-center gap-1 text-sm ${
              connectionStatus === 'connected'
                ? 'text-green-400'
                : connectionStatus === 'reconnecting'
                ? 'text-yellow-400'
                : 'text-red-400'
            }`}
          >
            {connectionStatus === 'connected' ? (
              <Wifi className="w-4 h-4" />
            ) : (
              <WifiOff className="w-4 h-4" />
            )}
          </span>

          {/* Players count */}
          <span className={`text-sm ${scheme.headerMuted} flex items-center gap-1`}>
            <Users className="w-4 h-4" />
            {players.length}
          </span>

          {/* GM badge or claim button */}
          {isGM ? (
            <button
              onClick={handleReleaseGM}
              className="flex items-center gap-1 px-2 py-1 bg-yellow-600/20 text-yellow-400 rounded text-sm hover:bg-yellow-600/30 transition-colors"
              title="Click to release GM role"
            >
              <Crown className="w-4 h-4" />
              GM
            </button>
          ) : (
            <Button variant="ghost" size="sm" onClick={handleClaimGM}>
              <Crown className="w-4 h-4 mr-1" />
              Assume GM
            </Button>
          )}

          {/* Settings */}
          {isGM && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowGMPanel(!showGMPanel)}
              className={showGMPanel ? scheme.buttonActive : ''}
            >
              <Settings className="w-4 h-4" />
            </Button>
          )}

          {/* Player panel toggle */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsPlayerPanelCollapsed((prev) => !prev)}
            title={isPlayerPanelCollapsed ? 'Show player panel' : 'Hide player panel'}
          >
            {isPlayerPanelCollapsed ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </Button>

          {/* Leave */}
          <Button variant="ghost" size="sm" onClick={handleLeave}>
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </header>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* GM Panel (collapsible) */}
        {isGM && showGMPanel && (
          <div className={`w-80 flex-shrink-0 border-r ${scheme.sidePanelBorder} ${scheme.sidePanelBg} overflow-hidden`}>
            <GMPanel onClose={() => setShowGMPanel(false)} />
          </div>
        )}

        {/* Map canvas */}
        <div className="flex-1 relative overflow-hidden">
          <MapCanvas />

          {/* Map controls overlay */}
          <div
            className={`absolute bottom-4 left-4 flex items-center gap-2 ${scheme.overlayBg} backdrop-blur-sm rounded-lg px-3 py-2 border ${scheme.overlayBorder} pointer-events-none`}
          >
            <span className={`text-sm ${scheme.headerMuted}`}>
              {activeMap ? `${activeMap.width}x${activeMap.height}` : 'No map'}
            </span>
          </div>
        </div>

        {/* Side panel */}
        {!isPlayerPanelCollapsed && (
          <div className={`w-96 flex-shrink-0 border-l ${scheme.sidePanelBorder} ${scheme.sidePanelBg} flex flex-col`}>
            {/* Tabs */}
            <div className={`flex border-b ${scheme.sidePanelBorder} overflow-x-auto`}>
              <TabButton
                active={sideTab === 'chat'}
                onClick={() => setSideTab('chat')}
                icon={<MessageSquare className="w-4 h-4" />}
                label="Chat"
                activeClassName={scheme.tabActive}
                inactiveClassName={scheme.tabInactive}
              />
              <TabButton
                active={sideTab === 'dice'}
                onClick={() => setSideTab('dice')}
                icon={<Dices className="w-4 h-4" />}
                label="Dice"
                activeClassName={scheme.tabActive}
                inactiveClassName={scheme.tabInactive}
              />
              {!isGM && (
                <TabButton
                  active={sideTab === 'initiative'}
                  onClick={() => setSideTab('initiative')}
                  icon={<Users className="w-4 h-4" />}
                  label="Initiative"
                  activeClassName={scheme.tabActive}
                  inactiveClassName={scheme.tabInactive}
                />
              )}
              <TabButton
                active={sideTab === 'notes'}
                onClick={() => setSideTab('notes')}
                icon={<FileText className="w-4 h-4" />}
                label="Notes"
                activeClassName={scheme.tabActive}
                inactiveClassName={scheme.tabInactive}
              />
              <TabButton
                active={sideTab === 'inventory'}
                onClick={() => setSideTab('inventory')}
                icon={<FileText className="w-4 h-4" />}
                label="Items"
                activeClassName={scheme.tabActive}
                inactiveClassName={scheme.tabInactive}
              />
              <TabButton
                active={sideTab === 'draw'}
                onClick={() => setSideTab('draw')}
                icon={<PencilLine className="w-4 h-4" />}
                label="Draw"
                activeClassName={scheme.tabActive}
                inactiveClassName={scheme.tabInactive}
              />
              <TabButton
                active={sideTab === 'settings'}
                onClick={() => setSideTab('settings')}
                icon={<Palette className="w-4 h-4" />}
                label="Prefs"
                activeClassName={scheme.tabActive}
                inactiveClassName={scheme.tabInactive}
              />
            </div>

            {/* Tab content */}
            <div className="flex-1 overflow-hidden">
              {sideTab === 'chat' && <ChatPanel />}
              {sideTab === 'dice' && <DicePanel />}
              {!isGM && sideTab === 'initiative' && <InitiativePanel />}
              {sideTab === 'notes' && <NotepadPanel />}
              {sideTab === 'inventory' && <InventoryPanel />}
              {sideTab === 'draw' && (
                <div className={`h-full overflow-y-auto p-4 ${scheme.settingsPanelBg}`}>
                  <div className={`rounded-lg border ${scheme.settingsPanelBorder} p-3`}>
                    <h3 className={`text-sm font-semibold ${scheme.settingsInputText}`}>Drawing Tools</h3>
                    <p className={`text-xs ${scheme.settingsInputMuted} mt-1`}>
                      Use these tools to annotate the map without cluttering the canvas.
                    </p>
                    <div className="mt-3 flex items-center justify-between text-xs">
                      <span className={scheme.settingsInputMuted}>
                        Player drawings: {drawingData.filter((drawing) => drawing.authorRole === 'player').length}
                      </span>
                      <button
                        onClick={handleClearPlayerDrawings}
                        className="px-2 py-1 rounded bg-red-500/20 text-red-300 hover:bg-red-500/30 transition-colors"
                        disabled={!activeMap || drawingData.every((drawing) => drawing.authorRole !== 'player')}
                      >
                        Clear all
                      </button>
                    </div>
                    <div className="mt-3 max-h-72 overflow-y-auto pr-2">
                      <DrawingTools />
                    </div>
                  </div>
                </div>
              )}
              {sideTab === 'settings' && (
                <PlayerSettingsPanel
                  colorScheme={colorScheme}
                  onColorSchemeChange={setColorScheme}
                  isPanelCollapsed={isPlayerPanelCollapsed}
                  onTogglePanel={() => setIsPlayerPanelCollapsed((prev) => !prev)}
                  scheme={scheme}
                />
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

interface TabButtonProps {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  activeClassName: string;
  inactiveClassName: string;
}

const TabButton: React.FC<TabButtonProps> = ({
  active,
  onClick,
  icon,
  label,
  activeClassName,
  inactiveClassName,
}) => (
  <button
    onClick={onClick}
    className={`
      flex-1 min-w-[84px] flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium
      transition-colors border-b-2
      ${active ? activeClassName : inactiveClassName}
    `}
  >
    {icon}
    {label}
  </button>
);

interface PlayerSettingsPanelProps {
  colorScheme: ColorScheme;
  onColorSchemeChange: (value: ColorScheme) => void;
  isPanelCollapsed: boolean;
  onTogglePanel: () => void;
  scheme: (typeof COLOR_SCHEMES)[ColorScheme];
}

const PlayerSettingsPanel: React.FC<PlayerSettingsPanelProps> = ({
  colorScheme,
  onColorSchemeChange,
  isPanelCollapsed,
  onTogglePanel,
  scheme,
}) => (
  <div className={`h-full overflow-y-auto p-4 ${scheme.settingsPanelBg}`}>
    <div className="space-y-4">
      <div className={`rounded-lg border ${scheme.settingsPanelBorder} p-3`}>
        <h3 className={`text-sm font-semibold ${scheme.settingsInputText}`}>Player Panel</h3>
        <p className={`text-xs ${scheme.settingsInputMuted} mt-1`}>
          Collapse the right-side panel to keep the map front and center.
        </p>
        <label className="mt-3 flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            className="h-4 w-4"
            checked={isPanelCollapsed}
            onChange={onTogglePanel}
          />
          <span className={scheme.settingsInputText}>Collapse player panel</span>
        </label>
      </div>

      <div className={`rounded-lg border ${scheme.settingsPanelBorder} p-3`}>
        <h3 className={`text-sm font-semibold ${scheme.settingsInputText}`}>Color Scheme</h3>
        <p className={`text-xs ${scheme.settingsInputMuted} mt-1`}>
          This only changes your local view.
        </p>
        <div className="mt-3">
          <label className={`block text-xs ${scheme.settingsInputMuted} mb-2`} htmlFor="color-scheme-select">
            Theme
          </label>
          <select
            id="color-scheme-select"
            className={`w-full rounded-md border ${scheme.settingsInputBorder} ${scheme.settingsInputBg} px-2 py-1 text-sm ${scheme.settingsInputText}`}
            value={colorScheme}
            onChange={(event) => onColorSchemeChange(event.target.value as ColorScheme)}
          >
            {Object.entries(COLOR_SCHEMES).map(([value, data]) => (
              <option key={value} value={value}>
                {data.label}
              </option>
            ))}
          </select>
        </div>
      </div>

    </div>
  </div>
);
