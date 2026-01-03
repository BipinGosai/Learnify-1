import { SidebarTrigger } from '@/components/ui/sidebar'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import React from 'react'

function AppHeader({ hideSidebar = false, hideUserButton = false, showDashboardLink = false }) {
  return (
    <div className='p-4 flex justify-between items-center shadow-sm'>
      <div className='flex items-center gap-2'>
        {!hideSidebar && <SidebarTrigger />}
        {showDashboardLink && (
          <Button asChild variant='outline' size='sm'>
            <Link href='/workspace'>Back to Dashboard</Link>
          </Button>
        )}
      </div>

      {!hideUserButton && (
        <Button asChild variant='outline' size='sm'>
          <Link href='/sign-out'>Sign Out</Link>
        </Button>
      )}
    </div>
  )
}

export default AppHeader
