import React from "react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";


function ChapterListSidebar({courseInfo}){
    const course=courseInfo?.courses;
    const enrollCourse=courseInfo?.enrollCourse;
    const courseContent=courseInfo?.courses?.courseContent;
    return(
        <div className="w-80 bg-secondary h-screen p-5">
            <h2 className="text-xl font-bold my-5">Chapters</h2>
           <Accordion type='single' collapsible>
            {courseContent?.map((chapter,index)=>{
            <AccordionItem value='item-1' key={index}>
              <AccordionTrigger> Hello</AccordionTrigger>
              <AccordionContent>
                hhhhhh
              </AccordionContent>
            </AccordionItem>
            })}
           </Accordion>
        </div>
    )
}
export default ChapterListSidebar