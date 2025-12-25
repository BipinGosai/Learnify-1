
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
import { Book, Compass, LayoutDashboard, UserCircle2Icon,WalletCards } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
// import AddNewCourseDialog from './AddNewCourseDialog'

const SidebarOptions=[
  {
    title:'Dashboard',
    icon:LayoutDashboard,
    path:'/workspace'
  },
  {
    title:'My Learning',
    icon:Book,
    path:'/workspace/my-cources'
  },
  {
    title:'Explore Courses',
    icon:Compass,
    path:'/workspace/explore'
  },
  {
    title:'Billing',
    icon:WalletCards,
    path:'/workspace/billing'
  },
  {
    title:'Profile',
    icon:UserCircle2Icon,
    path:'/workspace/profile'
  }
]
function AppSidebar() {

  const path = usePathname();

  return (
    <Sidebar>
      <SidebarHeader className={'p-4'} >
        <Image src={'logo.svg'} alt='logo' width={130} height={120}/>
        </SidebarHeader>
      <SidebarContent>
        <SidebarGroup >
          {/* <AddNewCourseDialog> */}
          <Button>Create New Course</Button>
          {/* </AddNewCourseDialog> */}
          </SidebarGroup>

        <SidebarGroup >
          <SidebarGroupContent>
            <SidebarMenu>
              {SidebarOptions.map((items,index)=>(<SidebarMenuItem key={index}>
                <SidebarMenuButton asChild className={'p-5'}> 
                  <Link href={items.path} className={`text=[17x] ${path.includes(items.path) && 'text-primary bg-blue-50'}`}>
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
