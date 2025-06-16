import { Outlet } from "react-router-dom";
import Sidebar from "@/components/Navigation/Sidebar";

const MainLayout = () => {
    return (
        <div className="flex w-full">
            {/* Sidebar */}
            <Sidebar />

            {/* Main Content */}
            <Outlet />
        </div>
    );
};

export default MainLayout;
