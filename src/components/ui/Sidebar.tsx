"use client";

import { useUser } from "@/app/context/Usercontext";
import UserSidebar from "./UserSidebar";
import { usePathname } from "next/navigation";

interface SidebarProps {
    open: boolean;
    setOpen : (value : boolean) => void;
}

export default function Sidebar( {open , setOpen} : SidebarProps ) {
    const { role } = useUser();
    const pathname = usePathname();
    
    if(pathname.startsWith("/pages/auth") || role === 'admin' || !open ) return

    return (
        <UserSidebar />
    )
}