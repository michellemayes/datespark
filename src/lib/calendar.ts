import { DateIdea } from "@/components/DateIdeaCard";

export interface CalendarEventParams {
  title: string;
  description: string;
  location?: string;
  startTime?: Date;
  endTime?: Date;
  duration?: string;
}

export const createGoogleCalendarUrl = (params: CalendarEventParams): string => {
  const { title, description, location, startTime, endTime, duration } = params;

  // If no specific time is provided, use tomorrow at 7 PM as default
  const defaultStart = startTime || (() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(19, 0, 0, 0); // 7 PM
    return tomorrow;
  })();

  // Calculate end time based on duration or provided endTime
  const defaultEnd = endTime || (() => {
    const end = new Date(defaultStart);
    const durationHours = duration === 'evening' ? 3 : duration === 'afternoon' ? 4 : 2;
    end.setHours(end.getHours() + durationHours);
    return end;
  })();

  // Format dates for Google Calendar (YYYYMMDDTHHMMSS)
  const formatDate = (date: Date): string => {
    return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  };

  const startFormatted = formatDate(defaultStart);
  const endFormatted = formatDate(defaultEnd);

  // Build the Google Calendar URL
  const baseUrl = 'https://calendar.google.com/calendar/render';
  const params_encoded = new URLSearchParams({
    action: 'TEMPLATE',
    text: title,
    dates: `${startFormatted}/${endFormatted}`,
    details: description,
    ...(location && { location }),
  });

  return `${baseUrl}?${params_encoded.toString()}`;
};

export const scheduleDate = (idea: DateIdea): void => {
  const description = [
    idea.description,
    '',
    '📋 Activities:',
    ...idea.activities.map(a => `• ${a}`),
    '',
    ...(idea.foodSpots && idea.foodSpots.length > 0 
      ? ['🍽️ Food & Drinks:', ...idea.foodSpots.map(f => `• ${f}`), ''] 
      : []),
    ...(idea.venueLinks && idea.venueLinks.length > 0 
      ? ['🔗 Venue Links:', ...idea.venueLinks.map(v => `• ${v.name}: ${v.url}`), ''] 
      : []),
    `💰 Budget: ${idea.budget}`,
    `👔 Dress Code: ${idea.dressCode}`,
  ].join('\n');

  const calendarUrl = createGoogleCalendarUrl({
    title: idea.title,
    description,
    location: idea.foodSpots?.[0] || '',
    duration: idea.duration,
  });

  // Open in new tab
  window.open(calendarUrl, '_blank');
};
