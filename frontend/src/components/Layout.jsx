import Sidebar from "./Sidebar";
import TopHeader from "./TopHeader";

export default function Layout({ children }) {
  return (
    <>
      <TopHeader />
      <div className="d-flex flex-wrap">
        <Sidebar />
        <div className="container-fluid mt-4" style={{ marginLeft: "220px" }}>
          {children}
        </div>
      </div>
    </>
  );
}
