import { Navigate, Route, Routes } from "react-router-dom";
import PageNotFound from "../components/Shared/PageNotFound";
import { useEffect, useState } from "react";
import Layout from "../layouts/Layout";
import Dashboard from "../pages/Dashboard/Dashboard";

// 🔹 Placeholder components para hindi mag red mark
const Placeholder = ({ title }: { title: string }) => (
  <div style={{ padding: "2rem" }}>
    <h1>{title}</h1>
    <p>Placeholder page for {title}</p>
  </div>
);

function App() {
  return (
    <Routes>
      <>
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />

          {/* Dashboard */}
          <Route path="dashboard" element={<Dashboard />} />


          {/* 404 */}
          <Route path="*" element={<PageNotFound />} />
        </Route>

        {/* Default redirect */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </>
    </Routes>
  );
}

export default App;
