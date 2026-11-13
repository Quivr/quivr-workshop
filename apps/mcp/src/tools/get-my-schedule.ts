import { datesBetween } from '../quivr/dates.js'
import { dateSchema, defineTool } from './define-tool.js'

const MAX_DAYS = 14

export const getMySchedule = defineTool({
  name: 'get_my_schedule',
  description:
    "Get the logged-in student's classes and events between two dates (inclusive, max 14 days). Returns items sorted by start time with title, start, end (ISO 8601, Brussels time), location and teachers.",
  inputSchema: {
    from: dateSchema.describe('First day, YYYY-MM-DD'),
    to: dateSchema.describe(
      'Last day, YYYY-MM-DD. Same as `from` for one day.'
    ),
  },
  run: async ({ from, to }, quivr) => {
    const dates = datesBetween(from, to)
    if (dates.length === 0) throw new Error('`to` must not be before `from`')
    if (dates.length > MAX_DAYS) {
      throw new Error(`Ask for at most ${MAX_DAYS} days at a time`)
    }

    const days = await Promise.all(dates.map(date => quivr.getMySchedule(date)))
    return days
      .flatMap(day => day.scheduleItems.scheduleItems)
      .map(item => ({
        kind: item.__typename === 'Lesson' ? 'class' : 'event',
        title: item.title,
        start: item.startTime,
        end: item.endTime,
        location: item.locations?.map(location => location.name).join(', '),
        teachers:
          'teachers' in item
            ? item.teachers.map(teacher => teacher.name)
            : undefined,
      }))
      .sort((a, b) => a.start.localeCompare(b.start))
  },
})
