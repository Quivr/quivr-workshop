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
  /(don't|do not|couldn't|could not|can't|cannot) (know|find|see)|no information|not (in|on) (your|the)|no .*(exam|record|restaurant)|doesn't (show|include|contain)|does not|isn't|is not/i

const escape = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
const anyOf = (names: string[]) =>
  new RegExp(names.map(name => escape(name.toLowerCase())).join('|'))

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
  const veggie = (restaurants[0]?.dishes ?? []).filter(
    d => d.mealCategory === 'WARM_BUFFET' && (d.vegetarian || d.vegan)
  )
  return {
    name: `vegetarian warm meal at ${restaurant.name} ${when}`,
    question: `Which vegetarian warm meals are there at ${restaurant.name} ${when}?`,
    expected: veggie.length
      ? `Vegetarian (including vegan) warm meals: ${veggie.map(d => d.name).join(', ')}`
      : 'There are no vegetarian warm meals (or the restaurant is closed).',
    facts: veggie.slice(0, 2).map(d => d.name),
    tools: ['list_restaurants', 'get_menu'],
  }
}

const leastBusyLibraryCase = async (): Promise<EvalCase> => {
  const { libraries } = await fixtures.getLibraries()
  const ranked = libraries
    .filter(l => l.data && l.data.capacity > 0 && l.data.occupancy > 0)
    .map(l => ({ name: l.name, ratio: l.data!.occupancy / l.data!.capacity }))
    .sort((a, b) => a.ratio - b.ratio)
  const best = ranked[0]
  const empty = libraries.filter(l => l.data?.occupancy === 0).map(l => l.name)
  return {
    name: 'least busy library',
    question: 'Which library is least busy right now?',
    expected: best
      ? `${best.name} is the least busy. ${empty.length ? `${empty.join(', ')} show 0 people, which may mean closed or not reporting: naming one of those instead is also correct.` : ''}`
      : 'No occupancy data.',
    facts: best ? [anyOf([best.name, ...empty])] : [DONT_KNOW],
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
    expected: (await upcomingItems()).length
      ? 'Lists the dishes at Alma 2 today and the next class with its location and time.'
      : 'Lists the dishes at Alma 2 today and says there are no upcoming classes in the schedule.',
    tools: ['get_menu', 'get_my_schedule'],
  },
]

defineEval('starter', cases)
