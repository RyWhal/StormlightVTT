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
} from 'lucide-react';
import { MapCanvas } from '../map/MapCanvas';
import { ChatPanel } from '../chat/ChatPanel';
import { DicePanel } from '../dice/DicePanel';
import { NotepadPanel } from '../shared/NotepadPanel';
import { GMPanel } from '../gm/GMPanel';
import { InventoryPanel } from '../inventory/InventoryPanel';
import { Button } from '../shared/Button';
import { useSessionStore, useIsGM } from '../../stores/sessionStore';
import { useMapStore } from '../../stores/mapStore';
import { useSession } from '../../hooks/useSession';
import { useToast } from '../shared/Toast';

type SideTab = 'chat' | 'dice' | 'notes' | 'inventory';

export const PlaySession: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const session = useSessionStore((state) => state.session);
  const currentUser = useSessionStore((state) => state.currentUser);
  const connectionStatus = useSessionStore((state) => state.connectionStatus);
  const players = useSessionStore((state) => state.players);
  const activeMap = useMapStore((state) => state.activeMap);
  const isGM = useIsGM();
  const { leaveSession, claimGM, releaseGM } = useSession();

  const [sideTab, setSideTab] = useState<SideTab>('chat');
  const [showGMPanel, setShowGMPanel] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

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

  return (
    <div className="h-screen flex flex-col bg-storm-950">
      {/* Header */}
      <header className="flex-shrink-0 h-12 bg-storm-900 border-b border-storm-700 px-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="font-semibold text-storm-100">{session.name}</h1>
          <span className="text-sm font-mono text-storm-400 bg-storm-800 px-2 py-0.5 rounded">
            {session.code}
          </span>
          {activeMap && (
            <span className="text-sm text-storm-300 flex items-center gap-1">
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
          <span className="text-sm text-storm-300 flex items-center gap-1">
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
          ) : !session.currentGmUsername ? (
            <Button variant="ghost" size="sm" onClick={handleClaimGM}>
              <Crown className="w-4 h-4 mr-1" />
              Claim GM
            </Button>
          ) : null}

          {/* Settings */}
          {isGM && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowGMPanel(!showGMPanel)}
              className={showGMPanel ? 'bg-storm-800' : ''}
            >
              <Settings className="w-4 h-4" />
            </Button>
          )}

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
          <div className="w-80 flex-shrink-0 border-r border-storm-700 bg-storm-900 overflow-hidden">
            <GMPanel onClose={() => setShowGMPanel(false)} />
          </div>
        )}

        {/* Map canvas */}
        <div className="flex-1 relative overflow-hidden">
          <MapCanvas />

          {/* Map controls overlay */}
          <div className="absolute bottom-4 left-4 flex items-center gap-2 bg-storm-900/90 backdrop-blur-sm rounded-lg px-3 py-2 border border-storm-700">
            <span className="text-sm text-storm-300">
              {activeMap ? `${activeMap.width}x${activeMap.height}` : 'No map'}
            </span>
          </div>
        </div>

        {/* Side panel */}
        <div className="w-96 flex-shrink-0 border-l border-storm-700 bg-storm-900 flex flex-col">
          {/* Tabs */}
          <div className="flex border-b border-storm-700">
            <TabButton
              active={sideTab === 'chat'}
              onClick={() => setSideTab('chat')}
              icon={<MessageSquare className="w-4 h-4" />}
              label="Chat"
            />
            <TabButton
              active={sideTab === 'dice'}
              onClick={() => setSideTab('dice')}
              icon={<Dices className="w-4 h-4" />}
              label="Dice"
            />
            <TabButton
              active={sideTab === 'notes'}
              onClick={() => setSideTab('notes')}
              icon={<FileText className="w-4 h-4" />}
              label="Notes"
            />
            <TabButton
              active={sideTab === 'inventory'}
              onClick={() => setSideTab('inventory')}
              icon={<FileText className="w-4 h-4" />}
              label="Items"
            />
          </div>

          {/* Tab content */}
          <div className="flex-1 overflow-hidden">
            {sideTab === 'chat' && <ChatPanel />}
            {sideTab === 'dice' && <DicePanel />}
            {sideTab === 'notes' && <NotepadPanel />}
            {sideTab === 'inventory' && <InventoryPanel />}
          </div>
        </div>
      </div>
    </div>
  );
};

interface TabButtonProps {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}

const TabButton: React.FC<TabButtonProps> = ({ active, onClick, icon, label }) => (
  <button
    onClick={onClick}
    className={`
      flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium
      transition-colors border-b-2
      ${
        active
          ? 'text-storm-100 border-storm-400 bg-storm-800/50'
          : 'text-storm-400 border-transparent hover:text-storm-200 hover:bg-storm-800/30'
      }
    `}
  >
    {icon}
    {label}
  </button>
);
