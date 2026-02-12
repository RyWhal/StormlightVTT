import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Users } from 'lucide-react';
import { Button } from '../shared/Button';
import { Card } from '../shared/Card';

export const Home: React.FC = () => {
  const navigate = useNavigate();

  return (
    <main className="tempest-shell flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-3xl">
        <Card className="p-8 lg:p-10">
          <p className="text-xs uppercase tracking-[0.2em] text-tempest-300">Tempest Table</p>
          <h1 className="mt-3 text-4xl font-semibold leading-tight md:text-5xl tempest-heading">
            A cleaner way to run your tabletop sessions.
          </h1>
          <p className="mt-4 max-w-xl text-base text-slate-400">
            Tempest keeps your map, player tools, and GM controls in focused spaces so your group can spend less
            time searching through panels and more time playing.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Button variant="primary" size="lg" onClick={() => navigate('/create')}>
              <Plus className="mr-2 h-4 w-4" />
              Start a session
            </Button>
            <Button variant="secondary" size="lg" onClick={() => navigate('/join')}>
              <Users className="mr-2 h-4 w-4" />
              Join with code
            </Button>
          </div>
        </Card>
      </div>
    </main>
  );
};
