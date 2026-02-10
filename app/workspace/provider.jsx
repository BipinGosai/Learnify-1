
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'
import React from 'react'
import AppSidebar from './_components/AppSidebar.jsx'
import AppHeader from './_components/AppHeader'

// Workspace provider composes the sidebar and header around page content.
function WorkspaceProvider({children}) {
  return (
    <SidebarProvider>
        {/* Persistent left navigation for workspace sections. */}
        <AppSidebar/>     
    <div className='w-full'>
        {/* Top header with user actions and context. */}
        <AppHeader/>
        {/* Main content area for each workspace page. */}
        <div className='p-4 md:p-10'>
      {children}
      </div>
    </div>
    </SidebarProvider>
  )
}

export default WorkspaceProvider
