import React from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { ThemeManager } from './components/layout/ThemeManager';
import { PreferencesBridge } from './components/layout/PreferencesBridge';
import { ToastProvider } from './context/ToastContext';
import Home from './pages/Home';
import Versions from './pages/Versions';
import Accounts from './pages/Accounts';
import Content from './pages/Content';
import Skins from './pages/Skins';
import Settings from './pages/Settings';

const App: React.FC = () => {
  return (
    <ToastProvider>
      <HashRouter>
        <ThemeManager />
        <PreferencesBridge />
        <Layout>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/versions" element={<Versions />} />
            <Route path="/accounts" element={<Accounts />} />
            <Route path="/content" element={<Content />} />
            <Route path="/skins" element={<Skins />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </Layout>
      </HashRouter>
    </ToastProvider>
  );
};

export default App;
