import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { Lock, Unlock, LogOut, Menu } from 'lucide-react'

export default function DashboardPage() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    try {
      await signOut()
      navigate('/login')
    } catch (err) {
      console.error('Logout failed:', err)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center">
            <Lock className="w-8 h-8 text-blue-600 mr-3" />
            <h1 className="text-2xl font-bold text-gray-900">SecureFile</h1>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-gray-700">{user?.email}</span>
            <button
              onClick={handleLogout}
              className="flex items-center bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Encrypt Card */}
          <div
            onClick={() => navigate('/encrypt')}
            className="bg-white rounded-lg shadow-lg p-8 hover:shadow-xl transition cursor-pointer transform hover:scale-105"
          >
            <div className="flex items-center mb-4">
              <Lock className="w-12 h-12 text-green-600 mr-4" />
              <h2 className="text-2xl font-bold text-gray-900">Encrypt File</h2>
            </div>
            <p className="text-gray-600 mb-4">
              Upload a file and encrypt it using AES-256-GCM encryption with your passphrase.
            </p>
            <div className="flex items-center text-green-600 font-semibold">
              Get Started
              <Menu className="w-4 h-4 ml-2 rotate-90" />
            </div>
          </div>

          {/* Decrypt Card */}
          <div
            onClick={() => navigate('/decrypt')}
            className="bg-white rounded-lg shadow-lg p-8 hover:shadow-xl transition cursor-pointer transform hover:scale-105"
          >
            <div className="flex items-center mb-4">
              <Unlock className="w-12 h-12 text-blue-600 mr-4" />
              <h2 className="text-2xl font-bold text-gray-900">Decrypt File</h2>
            </div>
            <p className="text-gray-600 mb-4">
              Upload an encrypted file and decrypt it using your passphrase to recover the original.
            </p>
            <div className="flex items-center text-blue-600 font-semibold">
              Get Started
              <Menu className="w-4 h-4 ml-2 rotate-90" />
            </div>
          </div>
        </div>

        {/* Info Section */}
        <div className="mt-12 bg-white rounded-lg shadow-lg p-8">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Security Features</h3>
          <ul className="space-y-2 text-gray-700">
            <li>✓ AES-256-GCM encryption with PBKDF2-SHA256 key derivation</li>
            <li>✓ Secure file storage in Supabase Storage (encrypted bucket)</li>
            <li>✓ Random IV generation for each encryption operation</li>
            <li>✓ Automatic audit logging of all operations</li>
            <li>✓ Support for files up to 5GB in size</li>
            <li>✓ Secure streaming to prevent memory exhaustion</li>
          </ul>
        </div>
      </main>
    </div>
  )
}
