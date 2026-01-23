import { describe, it, expect, vi, beforeEach } from 'vitest'
import { StudentService } from './student.service'
import { apiClient } from '../lib/api-client'
import type { Student, StudentFormData } from '../types'

// Mock the apiClient
vi.mock('../lib/api-client', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}))

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
          discipline: 'karate',
          is_active: true,
          join_date: '2023-01-01',
        },
      ]

      ;(apiClient.get as any).mockResolvedValue({
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

      ;(apiClient.get as any).mockResolvedValue({
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
        discipline: 'karate',
        is_active: true,
        join_date: '2023-01-01',
      }

      ;(apiClient.get as any).mockResolvedValue({
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
        discipline: 'karate',
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
        discipline: 'karate',
        is_active: true,
        join_date: '2024-01-01',
        date_of_birth: '2000-01-01',
        emergency_contact_name: 'Parent Name',
        emergency_contact_phone: '098-765-4321',
        notes: 'Test notes',
      }

      ;(apiClient.post as any).mockResolvedValue({
        success: true,
        data: mockStudent,
      })

      const result = await service.create(formData)

      expect(apiClient.post).toHaveBeenCalledWith('/api/students', expect.objectContaining({
        name: 'Jane Doe',
        email: 'jane@example.com',
        belt: 'yellow',
        discipline: 'karate',
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

      ;(apiClient.put as any).mockResolvedValue(mockResponse)

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
      ;(apiClient.put as any).mockResolvedValue({
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
      ;(apiClient.delete as any).mockResolvedValue({
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
          discipline: 'karate',
          is_active: true,
          join_date: '2023-01-01',
        },
        {
          id: '2',
          name: 'Jane',
          email: 'jane@example.com',
          belt: 'blue',
          discipline: 'karate',
          is_active: true,
          join_date: '2023-01-01',
        },
        {
          id: '3',
          name: 'Bob',
          email: 'bob@example.com',
          belt: 'white',
          discipline: 'jiu-jitsu',
          is_active: false,
          join_date: '2023-01-01',
        },
      ]

      ;(apiClient.get as any).mockResolvedValue({
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
          karate: 2,
          'jiu-jitsu': 1,
        },
      })
    })

    it('should handle stats calculation failure', async () => {
      ;(apiClient.get as any).mockResolvedValue({
        success: false,
        error: 'Failed to fetch students',
      })

      const result = await service.getStats()

      expect(result.success).toBe(false)
      expect(result.error).toBe('Failed to fetch students')
    })
  })
})