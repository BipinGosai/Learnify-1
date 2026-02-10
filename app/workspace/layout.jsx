import React from 'react'
import WorkspaceProvider from './provider'

// Workspace layout wraps all /workspace pages with shared UI chrome.
function WorkspaceLayout({children}) {
  return (
    <div>
      {/* Provider supplies sidebar and header scaffolding. */}
      <WorkspaceProvider>
        {children}
        </WorkspaceProvider>
    </div>
  )
}

export default WorkspaceLayout
