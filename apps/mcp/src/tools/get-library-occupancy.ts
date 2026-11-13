import { defineTool } from './define-tool.js'

export const getLibraryOccupancy = defineTool({
  name: 'get_library_occupancy',
  description:
    'Get the current occupancy of every library: occupied seats, capacity, percentage full and when it was measured.',
  inputSchema: {},
  run: async (_input, quivr) => {
    const { libraries } = await quivr.getLibraries()
    return libraries.map(library => ({
      id: library.id,
      name: library.name,
      address: library.location?.address,
      occupancy: library.data?.occupancy,
      capacity: library.data?.capacity,
      percentFull: library.data?.capacity
        ? Math.round((library.data.occupancy / library.data.capacity) * 100)
        : undefined,
      measuredAt: library.data?.timestamp,
    }))
  },
})
