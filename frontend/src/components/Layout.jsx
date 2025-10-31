import TopHeader from "./TopHeader";
import Sidebar from "./Sidebar";

export default function Layout({ children }) {
  return (
    <>
      <TopHeader />
      <Sidebar />
      <main className="app-main">
        {/* centers content and applies the clean page surface */}
        <div className="content-shell">
          <div className="content-sheet">
            {children}
          </div>
        </div>
      </main>
    </>
  );
}
