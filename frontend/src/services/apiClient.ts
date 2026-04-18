import axios, { AxiosInstance } from 'axios'
import { supabase } from './supabaseClient'

const API_BASE_URL = '/api'

let apiClient: AxiosInstance | null = null

export const getApiClient = async (): Promise<AxiosInstance> => {
  if (apiClient) {
    return apiClient
  }

  apiClient = axios.create({
    baseURL: API_BASE_URL,
    headers: {
      'Content-Type': 'application/json'
    }
  })

  // Add JWT token to all requests
  apiClient.interceptors.request.use(async (config) => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.access_token) {
        config.headers.Authorization = `Bearer ${session.access_token}`
      }
    } catch (error) {
      console.error('Failed to get session:', error)
    }
    return config
  })

  // Handle 401 responses
  apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response?.status === 401) {
        window.location.href = '/login'
      }
      return Promise.reject(error)
    }
  )

  return apiClient
}

export const encryptFile = async (file: File, passphrase: string): Promise<any> => {
  const client = await getApiClient()
  const formData = new FormData()
  formData.append('file', file)
  formData.append('passphrase', passphrase)

  return client.post('/encrypt', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}

export const decryptFile = async (fileId: string, passphrase: string): Promise<Blob> => {
  const client = await getApiClient()
  
  const response = await client.post(`/decrypt/${fileId}`, 
    { passphrase },
    {
      responseType: 'blob'
    }
  )
  
  return response.data
}

export const getAuditLogs = async (): Promise<any[]> => {
  const client = await getApiClient()
  const response = await client.get('/audit-logs')
  return response.data
}
