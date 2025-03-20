import { Outlet } from "react-router-dom";
import Sidebar from "@/components/Navigation/Sidebar";

const MainLayout = () => {
    return (
        <div className="w-full flex h-screen">
            {/* Sidebar */}
            <Sidebar />

            {/* Main Content */}
            <div className="w-full flex justify-center items-center">
                <Outlet />
            </div>
        </div>
    );
};

export default MainLayout;
