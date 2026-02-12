import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Plus, Users } from 'lucide-react';
import { Button } from '../shared/Button';
import { Card } from '../shared/Card';

export const Home: React.FC = () => {
  const navigate = useNavigate();

  return (
    <main className="tempest-shell flex items-center justify-center px-4 py-10">
      <div className="grid w-full max-w-5xl gap-6 lg:grid-cols-[1.2fr_1fr]">
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

        <Card className="p-6">
          <h2 className="text-lg font-semibold text-slate-100">Built around play flow</h2>
          <ul className="mt-4 space-y-4 text-sm text-slate-300">
            <li className="rounded-xl border border-slate-800 bg-slate-900/80 p-4">
              <p className="font-medium text-slate-100">Scene-first layout</p>
              <p className="mt-1 text-slate-400">Map stays central, with utility panels organized by purpose.</p>
            </li>
            <li className="rounded-xl border border-slate-800 bg-slate-900/80 p-4">
              <p className="font-medium text-slate-100">Unified component styling</p>
              <p className="mt-1 text-slate-400">Consistent typography, spacing, and interaction states app-wide.</p>
            </li>
            <li className="rounded-xl border border-slate-800 bg-slate-900/80 p-4">
              <p className="font-medium text-slate-100">Reduced redundancy</p>
              <p className="mt-1 text-slate-400">Collapsed theme complexity and grouped tools by player intent.</p>
            </li>
          </ul>

          <button
            onClick={() => navigate('/join')}
            className="mt-5 inline-flex items-center text-sm font-medium text-tempest-300 hover:text-tempest-200"
          >
            Jump into a live table
            <ArrowRight className="ml-1 h-4 w-4" />
          </button>
        </Card>
      </div>
    </main>
  );
};
