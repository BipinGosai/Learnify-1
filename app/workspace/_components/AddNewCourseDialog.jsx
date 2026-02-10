import React from 'react'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
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
import { useContext } from 'react'
import { UserDetailContext } from '@/context/UserDetailContext'

// Dialog that collects course details and triggers AI generation.
function AddNewCourseDialog({ children }) {

    const [open, setOpen] = useState(false);
    const [loading,setLoading] = useState(false);
    const [availableCourseDialog, setAvailableCourseDialog] = useState(null);
    const [formData,setFormData]=useState({
        name:'',
        description:'',
        includeVideo:false,
        noOfChapters:1,
        category:'',
        level:''
    })

    const router = useRouter();
    const { userDetail } = useContext(UserDetailContext);

    // Suggested course categories for the dropdown.
    const CATEGORY_OPTIONS = [
        'Programming & Software Development',
        'Web Development',
        'Mobile App Development',
        'Data Structures & Algorithms',
        'Data Science',
        'Machine Learning & AI',
        'Cybersecurity',
        'Cloud & DevOps',
        'Databases',
        'UI/UX Design',
        'Product Management',
        'Digital Marketing',
    ];


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
        // Basic client-side validation to keep requests clean.
        if (!userDetail?.email) {
            toast.error('Please sign in to generate a course');
            return;
        }
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
        // Ask the API to generate the course layout.
        const result = await axios.post(
            '/api/generate-course-layout',
            {
                ...formData,
                courseId: courseId
            },
            {
                headers: {
                    'x-user-email': userDetail.email,
                },
            }
        )
        console.log(result.data);
        if(result.data.resp=='limit exceed'){
            toast.warning('Course creation limit reached')
            setLoading(false);
            return;
        }
        const nextCourseId = result.data?.courseId;
        if (!nextCourseId) {
            toast.error('Failed to create course. Please try again.');
            setLoading(false);
            return;
        }

        // Close dialog and jump to course editor.
        setOpen(false);
        setLoading(false);
        router.push('/workspace/edit-course/'+nextCourseId);

    }catch(e){
        const status = e?.response?.status;
        const availableCourseId = e?.response?.data?.availableCourseId;
        const courseName = e?.response?.data?.courseName;
        
        if (status === 409 && availableCourseId) {
            setAvailableCourseDialog({
                courseId: availableCourseId,
                courseName: courseName,
            });
            setOpen(false);
            setLoading(false);
            return;
        }
        toast.error('Failed to create course. Please try again.');
        setLoading(false);
        console.log(e);
    }
    }

    return (
        <>
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Create New Course Using AI</DialogTitle>
                    <DialogDescription asChild>
                        <div className='flex flex-col gap-3 mt-4'>
                            <div>
                                <label> Course Name</label>
                                <Input
                                    placeholder="Course Name"
                                    onChange={(event)=>onHandleInputChange('name',event?.target.value)}
                                />
                            </div>

                            <div>
                                <label> Course Description(Optional)</label>
                                <Textarea
                                    placeholder="Course Description"
                                    onChange={(event)=>onHandleInputChange('description',event?.target.value)}
                                />
                            </div>

                            <div>
                                <label> No. of Chapters</label>
                                <Input
                                    placeholder="No. of Chapters"
                                    type='number'
                                    onChange={(event)=>onHandleInputChange('noOfChapters',Number(event?.target.value || 1))}
                                />
                            </div>

                            <div className='flex gap-3 item-center'>
                                <label>Include Video</label>
                                <Switch
                                    onCheckedChange={()=>onHandleInputChange('includeVideo',!formData?.includeVideo)}
                                />
                            </div>

                            <div>
                                <label>Difficulty Level</label>
                                <Select onValueChange={(value)=>onHandleInputChange('level',value)}>
                                    <SelectTrigger className="w-45">
                                        <SelectValue placeholder="Difficulty Level" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Beginner">Beginner</SelectItem>
                                        <SelectItem value="Moderate">Moderate</SelectItem>
                                        <SelectItem value="Advanced">Advanced</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div>
                                <label>Category</label>
                                <Select onValueChange={(value)=>onHandleInputChange('category',value)}>
                                    <SelectTrigger className="w-70">
                                        <SelectValue placeholder="Category" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {CATEGORY_OPTIONS.map((category) => (
                                            <SelectItem key={category} value={category}>
                                                {category}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <Button className={'w-full'} onClick={onGenerate} disabled={loading}>
                                {loading ? <Loader2Icon className='animate-spin'/> : <Sparkle/>}
                                Generate Course
                            </Button>
                        </div>
                    </DialogDescription>
                </DialogHeader>
            </DialogContent>
        </Dialog>

        {/* Dialog for already available course */}
        <Dialog open={!!availableCourseDialog} onOpenChange={(open) => !open && setAvailableCourseDialog(null)}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle className='flex items-center gap-2'>
                        <span>This course is already available</span>
                    </DialogTitle>
                    <DialogDescription>
                        This course "{availableCourseDialog?.courseName}" is already available in the system.
                    </DialogDescription>
                </DialogHeader>
                <p className='text-sm text-muted-foreground'>
                    You can view and enroll in this verified course from the Explore Courses section. Would you like to view it now?
                </p>
                <DialogFooter>
                    <Button 
                        variant='outline' 
                        onClick={() => setAvailableCourseDialog(null)}
                    >
                        Cancel
                    </Button>
                    <Button 
                        onClick={() => {
                            const courseId = availableCourseDialog?.courseId;
                            setAvailableCourseDialog(null);
                            router.push(`/workspace/explore?courseId=${courseId}`);
                        }}
                    >
                        View Course
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
        </>
    )
}

export default AddNewCourseDialog
