import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
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
import SettingsPage from "./pages/SettingsPage";
import AuthPage from "./pages/AuthPage";
import HowAuctionsWork from "./pages/HowAuctionsWork";
import HowPvpWorks from "./pages/HowPvpWorks";
import HowTournamentsWork from "./pages/HowTournamentsWork";
import DrawHistoryPage from "./pages/DrawHistoryPage";
import DrawDetailPage from "./pages/DrawDetailPage";
import HowSocialCircleWorks from "./pages/HowSocialCircleWorks";
import ResultsPage from "./pages/ResultsPage";
import ProfilePage from "./pages/ProfilePage";
import JackpotPage from "./pages/JackpotPage";
import AirdropPresentation from "./pages/AirdropPresentation";
import NotFound from "./pages/NotFound";

// Admin
import AdminLayout from "./pages/admin/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminAuctions from "./pages/admin/AdminAuctions";
import AdminAuctionDetail from "./pages/admin/AdminAuctionDetail";
import AdminCreateAuction from "./pages/admin/AdminCreateAuction";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminFinance from "./pages/admin/AdminFinance";
import AdminSettings from "./pages/admin/AdminSettings";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
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
            <Route path="/social/how-it-works" element={<HowSocialCircleWorks />} />
            <Route path="/badges" element={<BadgesPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/signin" element={<AuthPage mode="signin" />} />
            <Route path="/signup" element={<AuthPage mode="signup" />} />
            <Route path="/how-it-works" element={<HowAuctionsWork />} />
            <Route path="/results" element={<ResultsPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/jackpot" element={<JackpotPage />} />
            <Route path="/airdrop-deck" element={<AirdropPresentation />} />

            {/* Admin routes */}
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<AdminDashboard />} />
              <Route path="auctions" element={<AdminAuctions />} />
              <Route path="auctions/create" element={<AdminCreateAuction />} />
              <Route path="auctions/:id" element={<AdminAuctionDetail />} />
              <Route path="users" element={<AdminUsers />} />
              <Route path="finance" element={<AdminFinance />} />
              <Route path="settings" element={<AdminSettings />} />
            </Route>
            
            <Route path="*" element={<NotFound />} />
          </Routes>
          <MobileNav />
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
