import React from 'react'

function SkeletonList() {
    return (
        <div className="animate-pulse mb-2">
            <div className="rounded-md h-12 bg-gray-2 dark:bg-meta-4 mt-2"></div>
            <div className="rounded-md h-12 bg-gray-2 dark:bg-meta-4 mt-2"></div>
            <div className="rounded-md h-12 bg-gray-2 dark:bg-meta-4 mt-2"></div>
            <div className="rounded-md h-12 bg-gray-2 dark:bg-meta-4 mt-2"></div>
            <div className="rounded-md h-12 bg-gray-2 dark:bg-meta-4 mt-2"></div>
            <div className="rounded-md h-12 bg-gray-2 dark:bg-meta-4 mt-2"></div>
        </div>
    )
}

export default SkeletonList