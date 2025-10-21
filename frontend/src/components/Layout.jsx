import Sidebar from "./Sidebar";
import TopHeader from "./TopHeader";
import "../css/Layout.css";

export default function Layout({ children }) {
  return (
    <>
      <TopHeader />

      <div className="d-flex flex-wrap">
        <Sidebar />
        <div className="container-fluid mt-4 bigcont">
          {children}
        </div>
      </div>
    </>
  );
}
