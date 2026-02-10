import React from 'react'
import WelcomeBanner from '../_components/WelcomeBanner'
import EnrollCourseList from '../_components/EnrollCourseList'

// My Learning page: focus on enrolled courses.
function myLearning() {
  return (
    <div className="space-y-6">
      <WelcomeBanner />
      <h2 className='font-bold text-2xl'>My Learning</h2>
      <EnrollCourseList />
    </div>
  )
}

export default myLearning