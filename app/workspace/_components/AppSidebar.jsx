
"use client"
import React from 'react'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Book, Compass, LayoutDashboard, UserCircle2Icon } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import dynamic from 'next/dynamic'

const AddNewCourseDialog = dynamic(() => import('./AddNewCourseDialog'), { ssr: false })

const SidebarOptions=[
  {
    title:'Dashboard',
    icon:LayoutDashboard,
    path:'/workspace'
  },
  {
    title:'My Learning',
    icon:Book,
    path:'/workspace/my-learning'
  },
  {
    title:'Explore Courses',
    icon:Compass,
    path:'/workspace/explore'
  },
  {
    title:'Profile',
    icon:UserCircle2Icon,
    path:'/workspace/profile'
  }
]
function AppSidebar() {

  const path = usePathname();

  const isActive = (itemPath) => {
    if (!path) return false;
    // Dashboard should only be active on the exact route.
    if (itemPath === "/workspace") return path === "/workspace";
    // Other pages can be active on nested routes.
    return path === itemPath || path.startsWith(itemPath + "/");
  };

  return (
    <Sidebar>
      <SidebarHeader className={'p-4'} >
        <Image src={'/logo.svg'} alt='logo' width={130} height={120}/>
        </SidebarHeader>
      <SidebarContent>
        <SidebarGroup >
          <AddNewCourseDialog>
          <Button>Create New Course</Button>
          </AddNewCourseDialog>
          </SidebarGroup>

        <SidebarGroup >
          <SidebarGroupContent>
            <SidebarMenu>
              {SidebarOptions.map((items,index)=>(<SidebarMenuItem key={index}>
                <SidebarMenuButton asChild className={'p-5'}> 
                  <Link href={items.path} className={`text-[17px] ${isActive(items.path) ? 'text-primary bg-blue-50' : ''}`}>
                  <items.icon className='h-7 w-7'/>
                  <span>{items.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>))}
            </SidebarMenu>
          </SidebarGroupContent>
       </SidebarGroup>
      </SidebarContent>
      <SidebarFooter />
    </Sidebar>
  )
}

export default AppSidebar
