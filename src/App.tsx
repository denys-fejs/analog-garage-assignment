import React from "react";

import { Layout } from "./layout/Layout";
import { UIProvider } from "./context/UIContext";
import { DataProvider } from "./context/DataContext";
import { Dashboard } from "./views/Dashboard/Dashboard";

import "./app.css";

// Main App component
const App: React.FC = () => {
  return (
    <UIProvider>
      <DataProvider>
        <Layout>
          <Dashboard />
        </Layout>
      </DataProvider>
    </UIProvider>
  );
};

export default App;
