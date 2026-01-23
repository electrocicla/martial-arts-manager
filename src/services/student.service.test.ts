import { describe, it, expect, vi, beforeEach } from 'vitest'
import { StudentService } from './student.service'
import { apiClient } from '../lib/api-client'
import type { Student, StudentFormData } from '../types/index'

// Mock the apiClient
vi.mock('../lib/api-client', () => {
  const mockGet = vi.fn()
  const mockPost = vi.fn()
  const mockPut = vi.fn()
  const mockDelete = vi.fn()

  return {
    apiClient: {
      get: mockGet,
      post: mockPost,
      put: mockPut,
      delete: mockDelete,
    },
  }
})

// Get references to the mocked functions
const mockGet = vi.mocked(apiClient.get)
const mockPost = vi.mocked(apiClient.post)
const mockPut = vi.mocked(apiClient.put)
const mockDelete = vi.mocked(apiClient.delete)

describe('StudentService', () => {
  let service: StudentService

  beforeEach(() => {
    service = new StudentService()
    vi.clearAllMocks()
  })

  describe('getAll', () => {
    it('should fetch all students without filters', async () => {
      const mockStudents: Student[] = [
        {
          id: '1',
          name: 'John Doe',
          email: 'john@example.com',
          belt: 'white',
          discipline: 'Karate',
          is_active: 1,
          join_date: '2023-01-01',
          created_at: '2023-01-01T00:00:00Z',
          updated_at: '2023-01-01T00:00:00Z',
        },
      ]

      mockGet.mockResolvedValue({
        success: true,
        data: mockStudents,
      })

      const result = await service.getAll()

      expect(apiClient.get).toHaveBeenCalledWith('/api/students')
      expect(result).toEqual({
        success: true,
        data: mockStudents,
      })
    })

    it('should fetch students with filters', async () => {
      const filters = {
        belt: 'blue',
        discipline: 'jiu-jitsu',
        isActive: true,
        search: 'john',
      }

      mockGet.mockResolvedValue({
        success: true,
        data: [],
      })

      await service.getAll(filters)

      expect(apiClient.get).toHaveBeenCalledWith(
        '/api/students?belt=blue&discipline=jiu-jitsu&is_active=true&search=john'
      )
    })
  })

  describe('getById', () => {
    it('should fetch a student by id', async () => {
      const mockStudent: Student = {
        id: '1',
        name: 'John Doe',
        email: 'john@example.com',
        belt: 'white',
        discipline: 'Karate',
        is_active: 1,
        join_date: '2023-01-01',
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z',
      }

      mockGet.mockResolvedValue({
        success: true,
        data: mockStudent,
      })

      const result = await service.getById('1')

      expect(apiClient.get).toHaveBeenCalledWith('/api/students/1')
      expect(result).toEqual({
        success: true,
        data: mockStudent,
      })
    })
  })

  describe('create', () => {
    it('should create a new student', async () => {
      const formData: StudentFormData = {
        name: 'Jane Doe',
        email: 'jane@example.com',
        phone: '123-456-7890',
        belt: 'yellow',
        discipline: 'Karate',
        dateOfBirth: '2000-01-01',
        emergencyContactName: 'Parent Name',
        emergencyContactPhone: '098-765-4321',
        notes: 'Test notes',
      }

      const mockStudent: Student = {
        id: '2',
        name: 'Jane Doe',
        email: 'jane@example.com',
        phone: '123-456-7890',
        belt: 'yellow',
        discipline: 'Karate',
        is_active: 1,
        join_date: '2024-01-01',
        date_of_birth: '2000-01-01',
        emergency_contact_name: 'Parent Name',
        emergency_contact_phone: '098-765-4321',
        notes: 'Test notes',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      }

      mockPost.mockResolvedValue({
        success: true,
        data: mockStudent,
      })

      const result = await service.create(formData)

      expect(apiClient.post).toHaveBeenCalledWith('/api/students', expect.objectContaining({
        name: 'Jane Doe',
        email: 'jane@example.com',
        belt: 'yellow',
        discipline: 'Karate',
      }))
      expect(result.success).toBe(true)
    })
  })

  describe('update', () => {
    it('should update a student', async () => {
      const updateData: Partial<StudentFormData> = {
        name: 'Updated Name',
        belt: 'green',
      }

      const mockResponse = {
        success: true,
        data: {
          student: {
            id: '1',
            name: 'Updated Name',
            belt: 'green',
          },
        },
      }

      mockPut.mockResolvedValue(mockResponse)

      const result = await service.update('1', updateData)

      expect(apiClient.put).toHaveBeenCalledWith('/api/students/1', {
        id: '1',
        name: 'Updated Name',
        belt: 'green',
      })
      expect(result).toEqual({
        success: true,
        data: mockResponse.data.student,
      })
    })

    it('should handle update failure', async () => {
      mockPut.mockResolvedValue({
        success: false,
        error: 'Update failed',
      })

      const result = await service.update('1', { name: 'New Name' })

      expect(result).toEqual({
        success: false,
        error: 'Update failed',
      })
    })
  })

  describe('delete', () => {
    it('should delete a student', async () => {
      mockDelete.mockResolvedValue({
        success: true,
      })

      const result = await service.delete('1')

      expect(apiClient.delete).toHaveBeenCalledWith('/api/students/1')
      expect(result.success).toBe(true)
    })
  })

  describe('getStats', () => {
    it('should calculate student statistics', async () => {
      const mockStudents: Student[] = [
        {
          id: '1',
          name: 'John',
          email: 'john@example.com',
          belt: 'white',
          discipline: 'Karate',
          is_active: 1,
          join_date: '2023-01-01',
          created_at: '2023-01-01T00:00:00Z',
          updated_at: '2023-01-01T00:00:00Z',
        },
        {
          id: '2',
          name: 'Jane',
          email: 'jane@example.com',
          belt: 'blue',
          discipline: 'Karate',
          is_active: 1,
          join_date: '2023-01-01',
          created_at: '2023-01-01T00:00:00Z',
          updated_at: '2023-01-01T00:00:00Z',
        },
        {
          id: '3',
          name: 'Bob',
          email: 'bob@example.com',
          belt: 'white',
          discipline: 'Brazilian Jiu-Jitsu',
          is_active: 0,
          join_date: '2023-01-01',
          created_at: '2023-01-01T00:00:00Z',
          updated_at: '2023-01-01T00:00:00Z',
        },
      ]

      mockGet.mockResolvedValue({
        success: true,
        data: mockStudents,
      })

      const result = await service.getStats()

      expect(result.success).toBe(true)
      expect(result.data).toEqual({
        total: 3,
        active: 2,
        byBelt: {
          white: 2,
          blue: 1,
        },
        byDiscipline: {
          Karate: 2,
          'Brazilian Jiu-Jitsu': 1,
        },
      })
    })

    it('should handle stats calculation failure', async () => {
      mockGet.mockResolvedValue({
        success: false,
        error: 'Failed to fetch students',
      })

      const result = await service.getStats()

      expect(result.success).toBe(false)
      expect(result.error).toBe('Failed to fetch students')
    })
  })
})