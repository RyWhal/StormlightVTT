import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Sparkles } from 'lucide-react';
import { Button } from '../shared/Button';
import { Input } from '../shared/Input';
import { Card, CardHeader, CardTitle } from '../shared/Card';
import { useToast } from '../shared/Toast';
import { useSession } from '../../hooks/useSession';
import { validateSessionName, validateUsername } from '../../lib/validation';

export const SessionCreate: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { createSession } = useSession();

  const [sessionName, setSessionName] = useState('');
  const [username, setUsername] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ sessionName?: string; username?: string }>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate
    const sessionNameValidation = validateSessionName(sessionName);
    const usernameValidation = validateUsername(username);

    if (!sessionNameValidation.valid || !usernameValidation.valid) {
      setErrors({
        sessionName: sessionNameValidation.error,
        username: usernameValidation.error,
      });
      return;
    }

    setErrors({});
    setIsLoading(true);

    const result = await createSession(sessionName, username);

    setIsLoading(false);

    if (result.success && result.code) {
      showToast(`Session created! Code: ${result.code}`, 'success');
      navigate('/play');
    } else {
      showToast(result.error || 'Failed to create session', 'error');
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
              <Sparkles className="w-5 h-5 text-storm-400" />
              Create Session
            </CardTitle>
          </CardHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Session Name"
              placeholder="e.g., Bridge Four Campaign"
              value={sessionName}
              onChange={(e) => setSessionName(e.target.value)}
              error={errors.sessionName}
              autoFocus
            />

            <Input
              label="Your Username"
              placeholder="e.g., GameMaster"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              error={errors.username}
              helperText="You'll automatically be the GM"
            />

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full"
              isLoading={isLoading}
            >
              Create Session
            </Button>
          </form>

          <p className="mt-4 text-sm text-storm-400 text-center">
            A unique session code will be generated for players to join.
          </p>
        </Card>
      </div>
    </div>
  );
};
