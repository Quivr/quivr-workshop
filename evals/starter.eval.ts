import { defineEval, type EvalCase } from './lib/define-eval.js'
import {
  findRestaurant,
  fixtures,
  timeOf,
  today,
  tomorrow,
  upcomingItems,
} from './lib/fixture-data.js'

const DONT_KNOW =
  /don't know|do not know|couldn't find|could not find|can't find|cannot find|no information|not (in|on) (your|the)|no .*(exam|record)|doesn't (show|include|contain)|does not/i

const nextClassCase = async (): Promise<EvalCase> => {
  const next = (await upcomingItems())[0]
  return {
    name: 'next class',
    question: 'Where is my next class?',
    expected: next
      ? `${next.title} at ${next.locations?.map(l => l.name).join(', ')} starting ${timeOf(next.startTime)}`
      : 'There are no upcoming classes in the schedule.',
    facts: next
      ? [next.locations?.[0]?.name ?? next.title, timeOf(next.startTime)]
      : [DONT_KNOW],
    tools: ['get_my_schedule'],
  }
}

const vegetarianCase = async (
  restaurantName: string,
  date: string,
  when: string
): Promise<EvalCase> => {
  const restaurant = await findRestaurant(restaurantName)
  const { restaurants } = await fixtures.getMenu(restaurant.id, date)
  const veggie = (restaurants[0]?.dishes ?? []).filter(d => d.vegetarian)
  return {
    name: `vegetarian at ${restaurant.name} ${when}`,
    question: `What's vegetarian at ${restaurant.name} ${when}?`,
    expected: veggie.length
      ? `Vegetarian dishes: ${veggie.map(d => d.name).join(', ')}`
      : 'There are no vegetarian dishes (or the restaurant is closed).',
    facts: veggie.slice(0, 2).map(d => d.name),
    tools: ['list_restaurants', 'get_menu'],
  }
}

const leastBusyLibraryCase = async (): Promise<EvalCase> => {
  const { libraries } = await fixtures.getLibraries()
  const ranked = libraries
    .filter(l => l.data && l.data.capacity > 0)
    .map(l => ({ name: l.name, ratio: l.data!.occupancy / l.data!.capacity }))
    .sort((a, b) => a.ratio - b.ratio)
  const best = ranked[0]
  return {
    name: 'least busy library',
    question: 'Which library is least busy right now?',
    expected: best ? `${best.name} is the least busy.` : 'No occupancy data.',
    facts: best ? [best.name] : [DONT_KNOW],
    tools: ['get_library_occupancy'],
  }
}

const cases: EvalCase[] = [
  await nextClassCase(),
  await vegetarianCase('Alma 2', today(), 'today'),
  await vegetarianCase('Alma 2', tomorrow(), 'tomorrow'),
  await leastBusyLibraryCase(),
  {
    name: 'list restaurants',
    question: 'Which student restaurants are there?',
    expected: `The restaurants: ${(await fixtures.listRestaurants()).restaurants.map(r => r.name).join(', ')}`,
    facts: (await fixtures.listRestaurants()).restaurants
      .slice(0, 2)
      .map(r => r.name),
    tools: ['list_restaurants'],
  },
  {
    name: 'unknown exam (must not invent)',
    question: 'Where is my Machine Learning exam?',
    expected:
      "The assistant says it can't find a Machine Learning exam in the schedule and doesn't invent a room or time.",
    facts: [DONT_KNOW],
    tools: ['get_my_schedule'],
  },
  {
    name: 'unknown restaurant (must not invent)',
    question: "What's on the menu at the Hogwarts Great Hall today?",
    expected:
      "The assistant says there is no restaurant with that name and doesn't invent a menu.",
    facts: [DONT_KNOW],
    tools: ['list_restaurants'],
  },
  {
    name: 'menu and next class combined',
    question: "What's on the menu at Alma 2 today and where is my next class?",
    expected:
      'Lists the dishes at Alma 2 today and the next class with its location and time.',
    tools: ['get_menu', 'get_my_schedule'],
  },
]

defineEval('starter', cases)
