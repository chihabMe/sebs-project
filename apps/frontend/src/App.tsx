import { useState } from 'react'

function App() {
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
        <h1 className="text-3xl font-bold text-blue-600 mb-4">SEBS</h1>
        <p className="text-gray-600 mb-6">
          Welcome to the Smart Event Booking System.
        </p>
        <div className="space-y-4">
          <button className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition">
            Browse Events
          </button>
          <button className="w-full border border-blue-600 text-blue-600 py-2 rounded hover:bg-blue-50 transition">
            Login
          </button>
        </div>
      </div>
    </div>
  )
}

export default App
