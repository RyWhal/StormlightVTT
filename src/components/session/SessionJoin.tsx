import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, LogIn } from 'lucide-react';
import { Button } from '../shared/Button';
import { Input } from '../shared/Input';
import { Card, CardHeader, CardTitle } from '../shared/Card';
import { useToast } from '../shared/Toast';
import { useSession } from '../../hooks/useSession';
import { validateUsername } from '../../lib/validation';
import { isValidSessionCodeFormat, normalizeSessionCode } from '../../lib/sessionCode';
import { supabase } from '../../lib/supabase';

type SessionPlayerOption = {
  username: string;
  isGm: boolean;
};

export const SessionJoin: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { joinSession } = useSession();
  const testSessionCode = import.meta.env.VITE_TEST_SESSION_CODE;
  const testSessionName = import.meta.env.VITE_TEST_SESSION_NAME ?? 'Test Session';
  const testSessionGmUsername = import.meta.env.VITE_TEST_SESSION_GM_USERNAME ?? 'Test GM';
  const normalizedTestSessionCode = testSessionCode
    ? normalizeSessionCode(testSessionCode)
    : null;

  const [sessionCode, setSessionCode] = useState('');
  const [username, setUsername] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ sessionCode?: string; username?: string }>({});
  const [existingPlayers, setExistingPlayers] = useState<SessionPlayerOption[]>([]);
  const [isLoadingPlayers, setIsLoadingPlayers] = useState(false);

  useEffect(() => {
    const normalizedCode = normalizeSessionCode(sessionCode);
    if (!isValidSessionCodeFormat(normalizedCode)) {
      setExistingPlayers([]);
      return;
    }
    if (normalizedTestSessionCode && normalizedCode === normalizedTestSessionCode) {
      setExistingPlayers([{ username: testSessionGmUsername, isGm: true }]);
      setIsLoadingPlayers(false);
      return;
    }

    let isActive = true;

    const loadPlayers = async () => {
      setIsLoadingPlayers(true);

      const { data: sessionData, error: sessionError } = await supabase
        .from('sessions')
        .select('id')
        .eq('code', normalizedCode)
        .single();

      if (sessionError || !sessionData) {
        if (isActive) {
          setExistingPlayers([]);
          setIsLoadingPlayers(false);
        }
        return;
      }

      const { data: playersData } = await supabase
        .from('session_players')
        .select('username, is_gm')
        .eq('session_id', sessionData.id);

      if (isActive) {
        const players =
          playersData?.map((player) => ({
            username: player.username,
            isGm: player.is_gm,
          })) ?? [];

        players.sort((a, b) => a.username.localeCompare(b.username));
        setExistingPlayers(players);
        setIsLoadingPlayers(false);
      }
    };

    void loadPlayers();

    return () => {
      isActive = false;
    };
  }, [sessionCode]);

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Auto-format as user types
    const value = e.target.value.toUpperCase().replace(/[^A-HJ-NP-Z2-9-]/g, '');
    if (value.length <= 9) {
      setSessionCode(value);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate
    const normalizedCode = normalizeSessionCode(sessionCode);
    const usernameValidation = validateUsername(username);

    const newErrors: { sessionCode?: string; username?: string } = {};

    if (!isValidSessionCodeFormat(normalizedCode)) {
      newErrors.sessionCode = 'Invalid session code format (e.g., ABCD-1234)';
    }

    if (!usernameValidation.valid) {
      newErrors.username = usernameValidation.error;
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setIsLoading(true);

    const result = await joinSession(normalizedCode, username);

    setIsLoading(false);

    if (result.success) {
      showToast('Joined session!', 'success');
      navigate('/lobby');
    } else {
      showToast(result.error || 'Failed to join session', 'error');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-storm-950 to-storm-900">
      <div className="w-full max-w-md">
        <Button
          variant="ghost"
          className="mb-4"
          onClick={() => navigate('/')}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LogIn className="w-5 h-5 text-storm-400" />
              Join Session
            </CardTitle>
          </CardHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Session Code"
              placeholder="XXXX-XXXX"
              value={sessionCode}
              onChange={handleCodeChange}
              error={errors.sessionCode}
              className="font-mono text-lg tracking-wider text-center"
              autoFocus
            />

            <Input
              label="Your Username"
              placeholder="e.g., Ryan"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              error={errors.username}
            />

            {normalizedTestSessionCode ? (
              <div className="rounded-lg border border-storm-700 bg-storm-900/60 p-3 text-sm text-storm-300">
                <p className="font-medium text-storm-200">{testSessionName}</p>
                <p className="mt-1 font-mono text-storm-400">
                  Code: {normalizedTestSessionCode}
                </p>
                <p className="mt-1 text-storm-400">
                  GM username: {testSessionGmUsername}
                </p>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  className="mt-3 w-full"
                  onClick={() => {
                    setSessionCode(normalizedTestSessionCode);
                    setUsername(testSessionGmUsername);
                  }}
                >
                  Use Test Session
                </Button>
              </div>
            ) : null}

            {isLoadingPlayers ? (
              <div className="text-sm text-storm-400">Loading existing players…</div>
            ) : existingPlayers.length > 0 ? (
              <div className="space-y-2">
                <p className="text-xs uppercase tracking-wide text-storm-500">
                  Rejoin as
                </p>
                <div className="flex flex-wrap gap-2">
                  {existingPlayers.map((player) => (
                    <button
                      key={player.username}
                      type="button"
                      onClick={() => setUsername(player.username)}
                      className="px-3 py-1 rounded-full text-sm bg-storm-800 text-storm-200 hover:bg-storm-700 transition-colors"
                    >
                      {player.username}
                      {player.isGm && ' (GM)'}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full"
              isLoading={isLoading}
            >
              Join Session
            </Button>
          </form>

          <p className="mt-4 text-sm text-storm-400 text-center">
            Get the session code from your GM
          </p>
        </Card>
      </div>
    </div>
  );
};
