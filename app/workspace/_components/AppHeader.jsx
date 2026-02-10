import { SidebarTrigger } from '@/components/ui/sidebar'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import React from 'react'

// Top bar for workspace pages (sidebar toggle + sign-out).
function AppHeader({ hideSidebar = false, hideUserButton = false, showDashboardLink = false }) {
  return (
    <div className='p-4 flex justify-between items-center shadow-sm'>
      <div className='flex items-center gap-2'>
        {!hideSidebar && <SidebarTrigger />}
        {/* Optional back link when inside nested pages. */}
        {showDashboardLink && (
          <Button asChild variant='outline' size='sm'>
            <Link href='/workspace'>Back to Dashboard</Link>
          </Button>
        )}
      </div>

      {/* Simple sign-out action on the right. */}
      {!hideUserButton && (
        <Button asChild variant='outline' size='sm'>
          <Link href='/sign-out'>Sign Out</Link>
        </Button>
      )}
    </div>
  )
}

export default AppHeader
