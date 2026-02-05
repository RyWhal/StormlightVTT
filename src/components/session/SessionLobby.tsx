import React from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Users, Crown, ArrowRight, LogOut } from 'lucide-react';
import { Button } from '../shared/Button';
import { Card, CardHeader, CardTitle } from '../shared/Card';
import { useToast } from '../shared/Toast';
import { useSessionStore } from '../../stores/sessionStore';
import { useCharacters } from '../../hooks/useCharacters';
import { useSession } from '../../hooks/useSession';
import type { Character } from '../../types';

export const SessionLobby: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const session = useSessionStore((state) => state.session);
  const currentUser = useSessionStore((state) => state.currentUser);
  const players = useSessionStore((state) => state.players);
  const { characters, claimCharacter } = useCharacters();
  const { leaveSession } = useSession();

  if (!session || !currentUser) {
    navigate('/');
    return null;
  }

  const handleClaimCharacter = async (character: Character) => {
    const result = await claimCharacter(character.id);
    if (result.success) {
      showToast(`You are now playing as ${character.name}!`, 'success');
    } else {
      showToast(result.error || 'Failed to claim character', 'error');
    }
  };

  const handleEnterSession = () => {
    navigate('/play');
  };

  const handleLeave = async () => {
    await leaveSession();
    navigate('/');
  };

  const myCharacter = characters.find(
    (c) => c.claimedByUsername === currentUser.username
  );

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-storm-950 to-storm-900">
      <div className="w-full max-w-2xl">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>{session.name}</CardTitle>
                <p className="text-storm-400 font-mono mt-1">
                  Code: {session.code}
                </p>
              </div>
              {currentUser.isGm && (
                <span className="flex items-center gap-1 px-3 py-1 bg-yellow-600/20 text-yellow-400 rounded-full text-sm">
                  <Crown className="w-4 h-4" />
                  GM
                </span>
              )}
            </div>
          </CardHeader>

          {/* Players Online */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-storm-300 mb-2 flex items-center gap-2">
              <Users className="w-4 h-4" />
              Players Online ({players.length})
            </h3>
            <div className="flex flex-wrap gap-2">
              {players.map((player) => (
                <span
                  key={player.id}
                  className={`
                    px-3 py-1 rounded-full text-sm
                    ${player.isGm ? 'bg-yellow-600/20 text-yellow-400' : 'bg-storm-800 text-storm-200'}
                  `}
                >
                  {player.username}
                  {player.isGm && <Crown className="w-3 h-3 inline ml-1" />}
                </span>
              ))}
            </div>
          </div>

          {/* Character Selection */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-storm-300 mb-3">
              Select Your Character
            </h3>

            {characters.length === 0 ? (
              <div className="text-center py-8 bg-storm-800/50 rounded-lg">
                <User className="w-12 h-12 text-storm-500 mx-auto mb-2" />
                <p className="text-storm-400">
                  {currentUser.isGm
                    ? 'Create characters in the GM panel after entering the session.'
                    : 'Waiting for GM to create characters...'}
                </p>
              </div>
            ) : (
              <div className="grid gap-3">
                {characters.map((character) => {
                  const isMine = character.claimedByUsername === currentUser.username;
                  const isClaimed = character.isClaimed && !isMine;

                  return (
                    <div
                      key={character.id}
                      className={`
                        flex items-center gap-4 p-4 rounded-lg border transition-colors
                        ${isMine
                          ? 'bg-storm-600/20 border-storm-500'
                          : isClaimed
                          ? 'bg-storm-800/50 border-storm-700 opacity-60'
                          : 'bg-storm-800 border-storm-700 hover:border-storm-500 cursor-pointer'
                        }
                      `}
                      onClick={() => !isClaimed && !isMine && handleClaimCharacter(character)}
                    >
                      {/* Token */}
                      <div className="w-12 h-12 rounded-full bg-storm-700 flex items-center justify-center overflow-hidden flex-shrink-0">
                        {character.tokenUrl ? (
                          <img
                            src={character.tokenUrl}
                            alt={character.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-xl font-bold text-storm-300">
                            {character.name.charAt(0)}
                          </span>
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-storm-100 truncate">
                          {character.name}
                        </h4>
                        <p className="text-sm text-storm-400">
                          {isMine
                            ? 'Your character'
                            : isClaimed
                            ? `Controlled by ${character.claimedByUsername}`
                            : 'Available'}
                        </p>
                      </div>

                      {/* Status */}
                      {isMine && (
                        <span className="px-3 py-1 bg-green-600/20 text-green-400 rounded-full text-sm">
                          Selected
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              variant="ghost"
              onClick={handleLeave}
              className="flex-shrink-0"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Leave
            </Button>

            <Button
              variant="primary"
              size="lg"
              className="flex-1"
              onClick={handleEnterSession}
            >
              Enter Session
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </div>

          {!myCharacter && !currentUser.isGm && (
            <p className="mt-3 text-sm text-storm-400 text-center">
              You can still enter without selecting a character
            </p>
          )}
        </Card>
      </div>
    </div>
  );
};
