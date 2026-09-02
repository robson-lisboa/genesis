import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import { Route, Switch, Router as WouterRouter } from 'wouter';
import { Shell } from '@/components/layout/Shell';

import Dashboard from '@/pages/dashboard';
import WorldMap from '@/pages/world-map';
import CityDetail from '@/pages/city-detail';
import Mission from '@/pages/mission';
import SkillTree from '@/pages/skills';
import Achievements from '@/pages/achievements';
import Leaderboard from '@/pages/leaderboard';
import Profile from '@/pages/profile';
import AiMentor from '@/pages/ai-mentor';
import DailyChallenge from '@/pages/daily-challenge';

const queryClient = new QueryClient();

function Router() {
  return (
    <Shell>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/world" component={WorldMap} />
        <Route path="/cities/:id" component={CityDetail} />
        <Route path="/missions/:id" component={Mission} />
        <Route path="/skills" component={SkillTree} />
        <Route path="/achievements" component={Achievements} />
        <Route path="/leaderboard" component={Leaderboard} />
        <Route path="/profile" component={Profile} />
        <Route path="/ai-mentor" component={AiMentor} />
        <Route path="/daily-challenge" component={DailyChallenge} />
        <Route component={NotFound} />
      </Switch>
    </Shell>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
