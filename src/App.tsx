import { FC } from "react";

import { Dashboard } from "@/views";
import { Layout } from "@/layout/Layout";
import { UIProvider } from "@/context/UIContext";
import { DataProvider } from "@/context/DataContext";

import "@/App.css";

// Main App component
const App: FC = () => {
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
