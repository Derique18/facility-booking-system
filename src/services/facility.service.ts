import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class FacilityService {
  // Create a new facility with location, capacity, operating hours, and creator link
  static async createFacility(
    data: {
      name: string;
      description?: string;
      category: string;
      location?: string;
      capacity?: number;
      openTime?: string;
      closeTime?: string;
    },
    adminUserId?: string
  ) {
    return await prisma.facility.create({
      data: {
        name: data.name,
        description: data.description || '',
        category: data.category,
        location: data.location || 'Main Campus',
        capacity: data.capacity ? Number(data.capacity) : 0,
        openTime: data.openTime || '09:00',
        closeTime: data.closeTime || '18:00',
        ...(adminUserId && { createdById: adminUserId }),
      },
      include: {
        createdBy: {
          select: { id: true, email: true, firstName: true, lastName: true },
        },
      },
    });
  }

  // Fetch all facilities with creator info
  static async getAllFacilities() {
    return await prisma.facility.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        createdBy: {
          select: { id: true, email: true, firstName: true, lastName: true },
        },
      },
    });
  }

  // Fetch single facility by ID
  static async getFacilityById(id: string) {
    const facility = await prisma.facility.findUnique({
      where: { id },
      include: {
        createdBy: {
          select: { id: true, email: true, firstName: true, lastName: true },
        },
      },
    });

    if (!facility) {
      throw new Error('Facility not found.');
    }
    return facility;
  }
}