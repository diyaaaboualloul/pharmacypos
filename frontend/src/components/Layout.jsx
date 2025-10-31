// src/components/Layout.jsx
import TopHeader from "./TopHeader";
import Sidebar, { SIDEBAR_WIDTH, TOPBAR_HEIGHT } from "./Sidebar";

export default function Layout({ title, children }) {
  return (
    <>
      <TopHeader />
      <Sidebar />

      {/* Main area under topbar, beside sidebar */}
      <main className="app-main" style={{ minHeight: `calc(100vh - ${TOPBAR_HEIGHT}px)` }}>
        <div className="content-shell">
          <div className="content-sheet">
            {title ? <h1 className="page-title">{title}</h1> : null}
            {children}
          </div>
        </div>
      </main>
    </>
  );
}
