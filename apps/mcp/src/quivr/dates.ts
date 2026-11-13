export const TIME_ZONE = 'Europe/Brussels'

const offsetFor = (date: string): string => {
  const noon = new Date(`${date}T12:00:00Z`)
  const name = new Intl.DateTimeFormat('en-US', {
    timeZone: TIME_ZONE,
    timeZoneName: 'longOffset',
  })
    .formatToParts(noon)
    .find(part => part.type === 'timeZoneName')?.value
  const offset = name?.replace('GMT', '')
  return offset ? offset : '+00:00'
}

/** Start and end of a calendar day in Brussels, as the backend expects. */
export const dayRange = (date: string) => {
  const offset = offsetFor(date)
  return {
    startTime: `${date}T00:00:00${offset}`,
    endTime: `${date}T23:59:59${offset}`,
  }
}

/** Today's date (YYYY-MM-DD) in Brussels for the given instant. */
export const brusselsDate = (instant: Date): string =>
  new Intl.DateTimeFormat('en-CA', { timeZone: TIME_ZONE }).format(instant)

export const addDays = (date: string, days: number): string => {
  const next = new Date(`${date}T12:00:00Z`)
  next.setUTCDate(next.getUTCDate() + days)
  return next.toISOString().slice(0, 10)
}

export const datesBetween = (from: string, to: string): string[] => {
  const dates: string[] = []
  for (let date = from; date <= to; date = addDays(date, 1)) dates.push(date)
  return dates
}
