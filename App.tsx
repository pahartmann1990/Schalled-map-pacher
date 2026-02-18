import React, { useState } from 'react';
import { MainView } from './views/MainView';
import { HelpView } from './views/HelpView';
import { AdminView } from './views/AdminView';

type View = 'main' | 'help' | 'admin';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>('main');
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);

  const navigateTo = (view: View) => {
    setCurrentView(view);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const renderView = () => {
    switch (currentView) {
      case 'main':
        return (
          <MainView 
            onNavigateHelp={() => navigateTo('help')}
            onNavigateAdmin={() => navigateTo('admin')}
            isAdminMode={isAdminAuthenticated}
          />
        );
      case 'help':
        return (
          <HelpView 
            onBack={() => navigateTo('main')}
          />
        );
      case 'admin':
        return (
          <AdminView 
            onBack={() => navigateTo('main')}
            isAuthenticated={isAdminAuthenticated}
            onAuthenticated={() => setIsAdminAuthenticated(true)}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen">
      {renderView()}
    </div>
  );
};

export default App;