import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { DashboardSidebar } from '@/components/DashboardSidebar';
import { Button } from '@/components/ui/button';
import { 
  Calendar as CalendarIcon, 
  Menu, 
  ChevronLeft, 
  ChevronRight,
  FileText,
  Clock
} from 'lucide-react';

interface Event {
  id: string;
  title: string;
  date: string;
  type: 'assignment' | 'quiz';
  course_title?: string;
}

const DashboardCalendar = () => {
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchEvents();
    }
  }, [user]);

  const fetchEvents = async () => {
    setIsLoading(true);

    // Fetch assignments with due dates
    const { data: assignments } = await supabase
      .from('assignments')
      .select('id, title, due_date, courses(title)')
      .eq('is_published', true)
      .not('due_date', 'is', null);

    const assignmentEvents: Event[] = (assignments || []).map((a) => ({
      id: a.id,
      title: a.title,
      date: a.due_date!,
      type: 'assignment' as const,
      course_title: (a.courses as { title: string } | null)?.title,
    }));

    setEvents(assignmentEvents);
    setIsLoading(false);
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();

    return { daysInMonth, startingDay: startingDay === 0 ? 6 : startingDay - 1 };
  };

  const getEventsForDay = (day: number) => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    return events.filter((e) => {
      const eventDate = new Date(e.date);
      return (
        eventDate.getFullYear() === year &&
        eventDate.getMonth() === month &&
        eventDate.getDate() === day
      );
    });
  };

  const isToday = (day: number) => {
    const today = new Date();
    return (
      today.getFullYear() === currentMonth.getFullYear() &&
      today.getMonth() === currentMonth.getMonth() &&
      today.getDate() === day
    );
  };

  const goToPreviousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const { daysInMonth, startingDay } = getDaysInMonth(currentMonth);
  const monthName = currentMonth.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
  const weekDays = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-hero-gradient flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  // Upcoming events (next 7 days)
  const today = new Date();
  const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
  const upcomingEvents = events
    .filter((e) => {
      const eventDate = new Date(e.date);
      return eventDate >= today && eventDate <= nextWeek;
    })
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-hero-gradient">
        <DashboardSidebar />

        <div className="flex-1 flex flex-col min-w-0">
          {/* Header */}
          <header className="bg-card/80 backdrop-blur-md border-b border-border sticky top-0 z-40 px-4 py-3">
            <div className="flex items-center gap-4">
              <SidebarTrigger className="lg:hidden">
                <Menu className="w-5 h-5" />
              </SidebarTrigger>
              <div>
                <h1 className="text-lg font-display text-foreground flex items-center gap-2">
                  <CalendarIcon className="w-5 h-5 text-rainbow-purple" />
                  Calendrier
                </h1>
                <p className="text-xs text-muted-foreground font-body">
                  {upcomingEvents.length} événement(s) à venir
                </p>
              </div>
            </div>
          </header>

          <main className="flex-1 p-4 md:p-6 overflow-auto">
            <div className="max-w-5xl mx-auto">
              <div className="grid lg:grid-cols-3 gap-6">
                {/* Calendar */}
                <div className="lg:col-span-2">
                  <div className="p-6 rounded-2xl bg-card border border-border">
                    {/* Month navigation */}
                    <div className="flex items-center justify-between mb-6">
                      <Button variant="ghost" size="icon" onClick={goToPreviousMonth}>
                        <ChevronLeft className="w-5 h-5" />
                      </Button>
                      <h2 className="text-xl font-display text-foreground capitalize">{monthName}</h2>
                      <Button variant="ghost" size="icon" onClick={goToNextMonth}>
                        <ChevronRight className="w-5 h-5" />
                      </Button>
                    </div>

                    {/* Week days header */}
                    <div className="grid grid-cols-7 gap-1 mb-2">
                      {weekDays.map((day) => (
                        <div key={day} className="text-center text-xs font-medium text-muted-foreground py-2">
                          {day}
                        </div>
                      ))}
                    </div>

                    {/* Calendar grid */}
                    <div className="grid grid-cols-7 gap-1">
                      {/* Empty cells for days before the first of the month */}
                      {Array.from({ length: startingDay }).map((_, i) => (
                        <div key={`empty-${i}`} className="aspect-square" />
                      ))}

                      {/* Days of the month */}
                      {Array.from({ length: daysInMonth }).map((_, i) => {
                        const day = i + 1;
                        const dayEvents = getEventsForDay(day);
                        const hasEvents = dayEvents.length > 0;

                        return (
                          <div
                            key={day}
                            className={`aspect-square p-1 rounded-lg flex flex-col items-center justify-center relative transition-colors ${
                              isToday(day)
                                ? 'bg-primary text-primary-foreground'
                                : hasEvents
                                ? 'bg-rainbow-purple/10 border border-rainbow-purple/30'
                                : 'hover:bg-muted/50'
                            }`}
                          >
                            <span className="text-sm font-medium">{day}</span>
                            {hasEvents && (
                              <div className="flex gap-0.5 mt-0.5">
                                {dayEvents.slice(0, 3).map((_, idx) => (
                                  <div
                                    key={idx}
                                    className={`w-1 h-1 rounded-full ${
                                      isToday(day) ? 'bg-primary-foreground' : 'bg-rainbow-purple'
                                    }`}
                                  />
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Upcoming events sidebar */}
                <div className="lg:col-span-1">
                  <div className="p-5 rounded-2xl bg-card border border-border">
                    <h3 className="text-base font-display text-foreground mb-4 flex items-center gap-2">
                      <Clock className="w-4 h-4 text-rainbow-orange" />
                      À venir (7 jours)
                    </h3>

                    {upcomingEvents.length === 0 ? (
                      <div className="text-center py-8">
                        <CalendarIcon className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground">Aucun événement à venir</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {upcomingEvents.map((event) => (
                          <div
                            key={event.id}
                            className="p-3 rounded-lg bg-muted/50 border border-border/50 cursor-pointer hover:border-primary/30 transition-colors"
                            onClick={() => {
                              if (event.type === 'assignment') {
                                navigate(`/assignment/${event.id}`);
                              }
                            }}
                          >
                            <div className="flex items-start gap-3">
                              <div className="w-8 h-8 rounded-lg bg-rainbow-purple/20 flex items-center justify-center flex-shrink-0">
                                <FileText className="w-4 h-4 text-rainbow-purple" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-foreground line-clamp-1">{event.title}</p>
                                {event.course_title && (
                                  <p className="text-xs text-muted-foreground">{event.course_title}</p>
                                )}
                                <p className="text-xs text-rainbow-coral mt-1">
                                  {new Date(event.date).toLocaleDateString('fr-FR', {
                                    weekday: 'short',
                                    day: 'numeric',
                                    month: 'short',
                                  })}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default DashboardCalendar;
