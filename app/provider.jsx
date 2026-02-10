"use client"
import { SelectedChapterIndexContext } from '@/context/SelectedChapterIndexContext';
import { UserDetailContext } from '@/context/UserDetailContext';
import axios from "axios";
import React,{useEffect, useState} from "react";
import { getStoredUser } from '@/lib/authClient';

// Global client-side provider: keeps user info and chapter selection available app-wide.
function Provider ({children}) {
    const [userDetail,setUserDetail]=useState(null);
    const [isUserLoading, setIsUserLoading] = useState(true);
    const [selectedChapterIndex,setSelectedChapterIndex]=useState(0);

    useEffect(()=>{
        // Load user data once when the app boots on the client.
        LoadMe();
    }, [])

    const LoadMe = async ()=>{
        setIsUserLoading(true);
        // Pull the last-known user from localStorage for a fast, offline-friendly fallback.
        const storedUser = getStoredUser();
        if (storedUser?.email) {
            // Let API routes identify the user without waiting for a session refresh.
            axios.defaults.headers.common['x-user-email'] = storedUser.email;
        }
        try {
            // Ask the server who the current user is (authoritative source).
            const resp = await axios.get('/api/auth/me');
            setUserDetail(resp.data?.user);
        } catch (err) {
            // If the server call fails, keep the best local guess instead of breaking the UI.
            setUserDetail(storedUser ?? null);
        } finally {
            setIsUserLoading(false);
        }
    }
    return(
        // Expose user info and selected chapter index to any child component.
        <UserDetailContext.Provider value={{userDetail,setUserDetail,isUserLoading}}>
        <SelectedChapterIndexContext.Provider value={{selectedChapterIndex,setSelectedChapterIndex}}>
            <div>{children}</div>
        </SelectedChapterIndexContext.Provider> 
        </UserDetailContext.Provider>
    )
}
export default Provider