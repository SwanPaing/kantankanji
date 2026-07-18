import { Outlet } from "react-router-dom";
import Nav from "./Nav";



const Layout = () => {
  return (
    <div className="min-h-screen text-white">
      <Nav/>
      <main className="mx-auto w-full px-3 sm:px-4 lg:px-6 pb-24 md:pb-10">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
