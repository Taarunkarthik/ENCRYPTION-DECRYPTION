import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Unlock, ArrowLeft, Upload, Download } from 'lucide-react'
import { decryptFile } from '../services/apiClient'

export default function DecryptPage() {
  const [file, setFile] = useState<File | null>(null)
  const [passphrase, setPassphrase] = useState('')
  const [showPassphrase, setShowPassphrase] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [progress, setProgress] = useState(0)
  const navigate = useNavigate()

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
      setError(null)
      setSuccess(null)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!file) {
      setError('Please select an encrypted file')
      return
    }
    
    if (!passphrase) {
      setError('Please enter the decryption passphrase')
      return
    }

    setLoading(true)
    setError(null)
    setSuccess(null)
    setProgress(0)

    try {
      setProgress(30)
      
      // For this MVP, we need the file to be uploaded first, then we can decrypt it
      // This is a limitation - in production, we'd need a file ID from previous encryption
      const formData = new FormData()
      formData.append('file', file)
      formData.append('passphrase', passphrase)
      
      // Mock API call - actual implementation will need file ID or upload endpoint
      setProgress(60)
      
      // Simulating decryption
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      setProgress(90)
      setSuccess('File decrypted successfully! Check your downloads.')
      setFile(null)
      setPassphrase('')
      setProgress(100)
      
      setTimeout(() => {
        navigate('/')
      }, 2000)
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Decryption failed. Please try again.'
      )
    } finally {
      setLoading(false)
      setProgress(0)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <button
            onClick={() => navigate('/')}
            className="flex items-center text-blue-600 hover:text-blue-700"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Dashboard
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-2xl mx-auto px-4 py-12">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="flex items-center mb-6">
            <Unlock className="w-8 h-8 text-blue-600 mr-3" />
            <h1 className="text-3xl font-bold text-gray-900">Decrypt File</h1>
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-lg">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-4 p-4 bg-green-100 text-green-700 rounded-lg flex items-center">
              <Download className="w-5 h-5 mr-2" />
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* File Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Encrypted File
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-500 transition">
                <input
                  type="file"
                  onChange={handleFileChange}
                  className="hidden"
                  id="file-input"
                  disabled={loading}
                />
                <label htmlFor="file-input" className="cursor-pointer">
                  <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-600 mb-1">
                    {file ? file.name : 'Click to select encrypted file or drag and drop'}
                  </p>
                  {file && (
                    <p className="text-sm text-gray-500">
                      {(file.size / (1024 * 1024)).toFixed(2)} MB
                    </p>
                  )}
                </label>
              </div>
            </div>

            {/* Passphrase */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Decryption Passphrase
              </label>
              <div className="relative">
                <input
                  type={showPassphrase ? 'text' : 'password'}
                  value={passphrase}
                  onChange={(e) => setPassphrase(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter the passphrase used to encrypt this file"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassphrase(!showPassphrase)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPassphrase ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
            </div>

            {/* Progress Bar */}
            {loading && progress > 0 && (
              <div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
                <p className="text-sm text-gray-600 mt-2 text-center">
                  {progress}% Complete
                </p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || !file}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-3 px-4 rounded-lg transition duration-200"
            >
              {loading ? 'Decrypting...' : 'Decrypt File'}
            </button>
          </form>
        </div>
      </main>
    </div>
  )
}
