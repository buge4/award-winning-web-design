import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import MobileNav from "./components/MobileNav";
import Index from "./pages/Index";
import AuctionsPage from "./pages/AuctionsPage";
import AuctionDetail from "./pages/AuctionDetail";
import RngLiveDraw from "./pages/RngLiveDraw";
import PvpArena from "./pages/PvpArena";
import LeaderboardPage from "./pages/LeaderboardPage";
import TournamentsPage from "./pages/TournamentsPage";
import TournamentDetail from "./pages/TournamentDetail";
import WalletPage from "./pages/WalletPage";
import SocialCirclePage from "./pages/SocialCirclePage";
import BadgesPage from "./pages/BadgesPage";
import AdminPage from "./pages/AdminPage";
import SettingsPage from "./pages/SettingsPage";
import AuthPage from "./pages/AuthPage";
import HowAuctionsWork from "./pages/HowAuctionsWork";
import HowPvpWorks from "./pages/HowPvpWorks";
import HowTournamentsWork from "./pages/HowTournamentsWork";
import DrawHistoryPage from "./pages/DrawHistoryPage";
import DrawDetailPage from "./pages/DrawDetailPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Navbar />
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/auctions" element={<AuctionsPage />} />
          <Route path="/auction/:id" element={<AuctionDetail />} />
          <Route path="/auction/:id/draw" element={<RngLiveDraw />} />
          <Route path="/draws" element={<DrawHistoryPage />} />
          <Route path="/draws/:weekNumber" element={<DrawDetailPage />} />
          <Route path="/draws/:weekNumber/replay" element={<RngLiveDraw />} />
          <Route path="/pvp" element={<PvpArena />} />
          <Route path="/pvp/how-it-works" element={<HowPvpWorks />} />
          <Route path="/leaderboard" element={<LeaderboardPage />} />
          <Route path="/tournaments" element={<TournamentsPage />} />
          <Route path="/tournaments/:id" element={<TournamentDetail />} />
          <Route path="/tournaments/how-it-works" element={<HowTournamentsWork />} />
          <Route path="/wallet" element={<WalletPage />} />
          <Route path="/social" element={<SocialCirclePage />} />
          <Route path="/badges" element={<BadgesPage />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/signin" element={<AuthPage mode="signin" />} />
          <Route path="/signup" element={<AuthPage mode="signup" />} />
          <Route path="/how-it-works" element={<HowAuctionsWork />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
        <MobileNav />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
