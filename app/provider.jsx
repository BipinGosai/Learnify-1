"use client"
import { SelectedChapterIndexContext } from '@/context/SelectedChapterIndexContext';
import { UserDetailContext } from '@/context/UserDetailContext';
import axios from "axios";
import React,{useEffect, useState} from "react";

function Provider ({children}) {
    const [userDetail,setUserDetail]=useState();
    const [selectedChapterIndex,setSelectedChapterIndex]=useState(0);

    useEffect(()=>{
        LoadMe();
    }, [])

    const LoadMe = async ()=>{
        try {
            const resp = await axios.get('/api/auth/me');
            setUserDetail(resp.data?.user);
        } catch (err) {
            setUserDetail(undefined);
        }
    }
    return(
        <UserDetailContext.Provider value={{userDetail,setUserDetail}}>
        <SelectedChapterIndexContext.Provider value={{selectedChapterIndex,setSelectedChapterIndex}}>
            <div>{children}</div>
        </SelectedChapterIndexContext.Provider> 
        </UserDetailContext.Provider>
    )
}
export default Provider