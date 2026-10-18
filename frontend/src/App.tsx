import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { ListingsPage } from './pages/ListingsPage';
import { CreateListingPage } from './pages/CreateListingPage';
import { ListingDetailPage } from './pages/ListingDetailPage';
import { BatchPage } from './pages/BatchPage';
import { VoiceProfilesPage } from './pages/VoiceProfilesPage';
import { SettingsPage } from './pages/SettingsPage';

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
        <Navbar />
        <main className="flex-1 pb-16">
          <Routes>
            <Route path="/" element={<ListingsPage />} />
            <Route path="/create" element={<CreateListingPage />} />
            <Route path="/listings/:id" element={<ListingDetailPage />} />
            <Route path="/batch" element={<BatchPage />} />
            <Route path="/voice-profiles" element={<VoiceProfilesPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
};

export default App;
