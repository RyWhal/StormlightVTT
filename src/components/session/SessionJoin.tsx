import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, LogIn } from 'lucide-react';
import { Button } from '../shared/Button';
import { Input } from '../shared/Input';
import { Card, CardHeader, CardTitle } from '../shared/Card';
import { useToast } from '../shared/Toast';
import { useSession } from '../../hooks/useSession';
import { validateUsername } from '../../lib/validation';
import { isValidSessionCodeFormat, normalizeSessionCode } from '../../lib/sessionCode';

export const SessionJoin: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { joinSession } = useSession();

  const [sessionCode, setSessionCode] = useState('');
  const [username, setUsername] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ sessionCode?: string; username?: string }>({});

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
