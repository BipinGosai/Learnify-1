import React from 'react'
import EditCourse from '../../edit-course/[courseId]/page';
// import { useParams } from 'next/navigation';

// Read-only view that reuses the edit course layout.
const ViewCourse= () => {
  // const { courseId } = useParams();
  return (
    <div>
      <EditCourse viewCourse={true}/>
    </div>
  )
}

export default ViewCourse 