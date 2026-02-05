import React, { useState } from 'react';
import {
  X,
  Map as MapIcon,
  Users,
  Skull,
  Eye,
  Download,
} from 'lucide-react';
import { MapManager } from './MapManager';
import { CharacterManager } from './CharacterManager';
import { NPCManager } from './NPCManager';
import { FogTools } from './FogTools';
import { SessionExport } from './SessionExport';

type GMTab = 'maps' | 'characters' | 'npcs' | 'fog' | 'export';

interface GMPanelProps {
  onClose: () => void;
}

export const GMPanel: React.FC<GMPanelProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<GMTab>('maps');

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-storm-700">
        <h2 className="font-semibold text-storm-100">GM Controls</h2>
        <button
          onClick={onClose}
          className="p-1 text-storm-400 hover:text-storm-200 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-storm-700">
        <GMTabButton
          active={activeTab === 'maps'}
          onClick={() => setActiveTab('maps')}
          icon={<MapIcon className="w-4 h-4" />}
          label="Maps"
        />
        <GMTabButton
          active={activeTab === 'characters'}
          onClick={() => setActiveTab('characters')}
          icon={<Users className="w-4 h-4" />}
          label="PCs"
        />
        <GMTabButton
          active={activeTab === 'npcs'}
          onClick={() => setActiveTab('npcs')}
          icon={<Skull className="w-4 h-4" />}
          label="NPCs"
        />
        <GMTabButton
          active={activeTab === 'fog'}
          onClick={() => setActiveTab('fog')}
          icon={<Eye className="w-4 h-4" />}
          label="Fog"
        />
        <GMTabButton
          active={activeTab === 'export'}
          onClick={() => setActiveTab('export')}
          icon={<Download className="w-4 h-4" />}
          label="Export"
        />
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'maps' && <MapManager />}
        {activeTab === 'characters' && <CharacterManager />}
        {activeTab === 'npcs' && <NPCManager />}
        {activeTab === 'fog' && <FogTools />}
        {activeTab === 'export' && <SessionExport />}
      </div>
    </div>
  );
};

interface GMTabButtonProps {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}

const GMTabButton: React.FC<GMTabButtonProps> = ({
  active,
  onClick,
  icon,
  label,
}) => (
  <button
    onClick={onClick}
    className={`
      flex-1 flex flex-col items-center justify-center gap-1 py-2 text-xs font-medium
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
