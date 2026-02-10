"use client"
import { SelectedChapterIndexContext } from '@/context/SelectedChapterIndexContext';
import { UserDetailContext } from '@/context/UserDetailContext';
import axios from "axios";
import React,{useEffect, useState} from "react";

function Provider ({children}) {
    const [userDetail,setUserDetail]=useState(null);
    const [isUserLoading, setIsUserLoading] = useState(true);
    const [selectedChapterIndex,setSelectedChapterIndex]=useState(0);

    useEffect(()=>{
        LoadMe();
    }, [])

    const LoadMe = async ()=>{
        setIsUserLoading(true);
        try {
            const resp = await axios.get('/api/auth/me');
            setUserDetail(resp.data?.user);
        } catch (err) {
            setUserDetail(null);
        } finally {
            setIsUserLoading(false);
        }
    }
    return(
        <UserDetailContext.Provider value={{userDetail,setUserDetail,isUserLoading}}>
        <SelectedChapterIndexContext.Provider value={{selectedChapterIndex,setSelectedChapterIndex}}>
            <div>{children}</div>
        </SelectedChapterIndexContext.Provider> 
        </UserDetailContext.Provider>
    )
}
export default Provider