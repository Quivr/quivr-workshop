import { defineTool } from './define-tool.js'

export const listRestaurants = defineTool({
  name: 'list_restaurants',
  description:
    'List the student restaurants with their id, name and address. Use the id with get_menu.',
  inputSchema: {},
  run: async (_input, quivr) => {
    const { restaurants } = await quivr.listRestaurants()
    return restaurants.map(restaurant => ({
      id: restaurant.id,
      name: restaurant.name,
      address: restaurant.location?.address,
    }))
  },
})
