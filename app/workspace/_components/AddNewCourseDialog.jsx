import React from 'react'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { useState } from 'react'
import { v4 as uuidv4} from 'uuid';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Button } from '@/components/ui/button'
import { Loader2Icon, Sparkle } from 'lucide-react'
import axios from 'axios'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

function AddNewCourseDialog({ children }) {

    const [open, setOpen] = useState(false);
    const [loading,setLoading] = useState(false);
    const [formData,setFormData]=useState({
        name:'',
        description:'',
        includeVideo:false,
        noOfChapters:1,
        category:'',
        level:''
    })

    const router = useRouter();


    const onHandleInputChange = (field,value)=>{
        setFormData(prev=>({
            ...prev,
            [field]:value
        }));
        console.log(formData);
    }
const onGenerate = async ()=>{
        console.log(formData);
        const courseId = uuidv4();
        try{
        if (!formData?.name?.trim()) {
            toast.error('Course name is required');
            return;
        }
        if (!formData?.level) {
            toast.error('Difficulty level is required');
            return;
        }
        if (!formData?.noOfChapters || Number(formData.noOfChapters) < 1) {
            toast.error('No. of chapters must be at least 1');
            return;
        }
        setLoading(true);
        const result = await axios.post('/api/generate-course-layout',{
            ...formData,
            courseId: courseId
        })
        console.log(result.data);
        if(result.data.resp=='limit exceed'){
            toast.warning('Please subscribe to plan!')
            setOpen(false);
            router.push('/workspace/billing');
            setLoading(false);
            return;
        }
        const nextCourseId = result.data?.courseId;
        if (!nextCourseId) {
            toast.error('Failed to create course. Please try again.');
            setLoading(false);
            return;
        }

        setOpen(false);
        setLoading(false);
        router.push('/workspace/edit-course/'+nextCourseId);

    }catch(e){
        setLoading(false);
        console.log(e);
    }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Create New Course Using AI</DialogTitle>
                    <DialogDescription asChild>
                        <div className='flex flex-col gap-3 mt-4'>
                            <div>
                                <label> Course Name</label>
                                <Input placeholder="Course Name" 
                                onChange={(event)=>onHandleInputChange('name',event?.target.value)}/>
                            </div>
                            <div>
                                <label> Course Description(Optional)</label>
                                <Textarea placeholder="Course Description"
                                onChange={(event)=>onHandleInputChange('description',event?.target.value)}/>
                            </div>
                            <div>
                                <label> No. of Chapters</label>
                                <Input placeholder="No. of Chapters" type='number' 
                                onChange={(event)=>onHandleInputChange('noOfChapters',Number(event?.target.value || 1))}/>
                            </div>
                            <div className='flex gap-3 item-center'>
                                <label>Include Video</label>
                                <Switch 
                                onCheckedChange={()=>onHandleInputChange('includeVideo',!formData?.includeVideo)}/>
                            </div>
                            <div>
                                <label>Difficulty Level</label>
                                <Select onValueChange={(value)=>onHandleInputChange('level',value)}>
                                    <SelectTrigger className="w-[180px]">
                                        <SelectValue placeholder="Difficulty Level" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="begineer">Beginner</SelectItem>
                                        <SelectItem value="Moderate">Moderate</SelectItem>
                                        <SelectItem value="Advance">Advance</SelectItem>
                                    </SelectContent>
                                </Select>

                            </div>
                            <div>
                                <label> Category </label>
                                                                <Input
                                                                    placeholder="Category (Separated by Comma)"
                                                                    onChange={(event)=>onHandleInputChange('category',event?.target.value)}
                                                                />
                            </div>
                            <Button className={'w-full'} onClick={onGenerate} disabled={loading}>
                                {loading?<Loader2Icon className='animate-spin'/> :
                                <Sparkle/>}Generate Course</Button>
                        </div>
                    </DialogDescription>
                </DialogHeader>
            </DialogContent>
        </Dialog>
    )
}

export default AddNewCourseDialog
