import React from 'react'
import JobForm from './components/JobForm'
import JobList from './components/JobList'

function App() {
  return (
    <div className="min-h-screen bg-gray-100">
      <div className="container mx-auto px-4 py-8">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            AI Workflow Management System
          </h1>
          <p className="text-gray-600">
            Submit and track AI jobs across multiple brands and job types
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div>
            <JobForm />
          </div>
          
          <div>
            <JobList />
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
