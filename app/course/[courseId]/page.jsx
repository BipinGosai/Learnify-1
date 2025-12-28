'use client';
import AppHeader from "@/app/workspace/_components/AppHeader";
import React,{useState,useEffect} from "react";
import ChapterContent from "./_components/ChapterContent";
import ChapterListSidebar from "./_components/ChapterListSidebar";
import { useParams } from "next/navigation";
import axios from "axios";

function Course(){
    const {courseId}=useParams();
    const [courseInfo,setCourseInfo]=useState(null);
     useEffect(()=>{
        GetEnrolledCourseById();
    }, [])
    const GetEnrolledCourseById= async ()=>{
        const result= await axios.get('/api/enroll-course?courseId='+courseId);
        console.log(result.data);
        setCourseInfo(result.data.length > 0 ? result.data[0] : null);
    }
    return(
        <div>
            <AppHeader hideSidebar={true}/>
            <div className="flex gap-10 ">
                <ChapterListSidebar courseInfo={courseInfo}/>
                <ChapterContent/>
            </div>
        </div>
    )
}
export default Course