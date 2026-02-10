import React from 'react'

// Simple header banner for the workspace dashboard.
function WelcomeBanner() {
  return (
    <div className='p-5 bg-linear-to-br from-purple-600 via-indigo-600 to-red-600 rounded-xl'>
      <h2 className='font-bold text-2xl text-white'>Welcome to Learnify</h2>
      <p className='text-white'>Learn, Create and Explore Your Favourite Courses</p>
    </div>
  )
}

export default WelcomeBanner