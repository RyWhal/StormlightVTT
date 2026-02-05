import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Users } from 'lucide-react';
import { Button } from '../shared/Button';
import { Card, CardHeader, CardTitle } from '../shared/Card';

export const Home: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-storm-950 to-storm-900">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-storm-100 mb-2 text-shadow-glow">
            Stormlight VTT
          </h1>
          <p className="text-storm-300">
            Virtual Tabletop for Stormlight RPG
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Get Started</CardTitle>
          </CardHeader>

          <div className="space-y-4">
            <Button
              variant="primary"
              size="lg"
              className="w-full"
              onClick={() => navigate('/create')}
            >
              <Plus className="w-5 h-5 mr-2" />
              Create New Session
            </Button>

            <Button
              variant="secondary"
              size="lg"
              className="w-full"
              onClick={() => navigate('/join')}
            >
              <Users className="w-5 h-5 mr-2" />
              Join Existing Session
            </Button>
          </div>

          <div className="mt-6 pt-6 border-t border-storm-700">
            <p className="text-sm text-storm-400 text-center">
              Create a session to start as GM, or join with a session code.
            </p>
          </div>
        </Card>

        <p className="mt-6 text-center text-sm text-storm-500">
          Designed for the Stormlight RPG by Brotherwise Games
        </p>
      </div>
    </div>
  );
};
