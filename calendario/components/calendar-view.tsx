'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import EventModal from './event-modal';

interface CalendarEvent {
  id: string;
  month_index: number;
  day: number;
  event_text: string;
  event_link: string | null;
  region: 'SC' | 'RS' | 'PR';
}

interface CalendarViewProps {
  events: Record<number, Record<number, CalendarEvent[]>>;
  setEvents: (events: Record<number, Record<number, CalendarEvent[]>>) => void;
}

const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];
const DAY_NAMES = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const DAYS_IN_MONTH = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
const YEAR = 2026;
const PROXIMITY_DAYS = 7;

export default function CalendarView({ events, setEvents }: CalendarViewProps) {
  const [currentView, setCurrentView] = useState<'annual' | 'monthly'>('annual');
  const [selectedMonth, setSelectedMonth] = useState(0);
  const [filterRegion, setFilterRegion] = useState<'all' | 'SC' | 'RS' | 'PR'>('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<{ month: number; day: number } | null>(null);

  const calculateRegionalCounts = () => {
    const counts = { SC: 0, RS: 0, PR: 0 };
    Object.values(events).forEach((monthData) => {
      Object.values(monthData).forEach((dayEvents) => {
        dayEvents.forEach((event) => {
          if (counts.hasOwnProperty(event.region)) {
            counts[event.region as 'SC' | 'RS' | 'PR']++;
          }
        });
      });
    });
    return counts;
  };

  const openModal = (month: number, day: number) => {
    setSelectedDate({ month, day });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setSelectedDate(null);
  };

  const addEvent = async (eventData: {
    text: string;
    link: string;
    region: 'SC' | 'RS' | 'PR';
  }) => {
    if (!selectedDate) return;

    try {
      const { error } = await supabase.from('events').insert([
        {
          month_index: selectedDate.month,
          day: selectedDate.day,
          event_text: eventData.text,
          event_link: eventData.link || null,
          region: eventData.region,
        },
      ]);

      if (error) throw error;

      // Fetch updated events
      const { data } = await supabase.from('events').select('*');
      const eventsMap: Record<number, Record<number, CalendarEvent[]>> = {};
      (data || []).forEach((event: CalendarEvent) => {
        if (!eventsMap[event.month_index]) {
          eventsMap[event.month_index] = {};
        }
        if (!eventsMap[event.month_index][event.day]) {
          eventsMap[event.month_index][event.day] = [];
        }
        eventsMap[event.month_index][event.day].push(event);
      });
      setEvents(eventsMap);
      closeModal();
    } catch (error) {
      console.error('Error adding event:', error);
    }
  };

  const deleteEvent = async (eventId: string) => {
    try {
      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', eventId);

      if (error) throw error;

      // Fetch updated events
      const { data } = await supabase.from('events').select('*');
      const eventsMap: Record<number, Record<number, CalendarEvent[]>> = {};
      (data || []).forEach((event: CalendarEvent) => {
        if (!eventsMap[event.month_index]) {
          eventsMap[event.month_index] = {};
        }
        if (!eventsMap[event.month_index][event.day]) {
          eventsMap[event.month_index][event.day] = [];
        }
        eventsMap[event.month_index][event.day].push(event);
      });
      setEvents(eventsMap);
    } catch (error) {
      console.error('Error deleting event:', error);
    }
  };

  const handleFilterChange = (region: 'all' | 'SC' | 'RS' | 'PR') => {
    if (filterRegion === region && region !== 'all') {
      setFilterRegion('all');
    } else {
      setFilterRegion(region);
    }
    if (currentView === 'monthly') {
      setCurrentView('annual');
    }
  };

  const regionalCounts = calculateRegionalCounts();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (currentView === 'annual') {
    return (
      <div className="w-full max-w-5xl mx-auto">
        <header className="mb-10">
          <h1 className="text-3xl sm:text-5xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-indigo-300 to-purple-400 mb-6">
            Calendário de Eventos
          </h1>

          <div className="flex flex-wrap items-center gap-3 mb-4">
            <select
              value={filterRegion}
              onChange={(e) => handleFilterChange(e.target.value as 'all' | 'SC' | 'RS' | 'PR')}
              className="px-4 py-2 bg-gray-800 text-indigo-400 rounded-xl border-2 border-gray-700 focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">Todas as Regiões</option>
              <option value="SC">Santa Catarina (SC)</option>
              <option value="RS">Rio Grande do Sul (RS)</option>
              <option value="PR">Paraná (PR)</option>
            </select>

            <span className="text-gray-300 text-sm font-semibold">Eventos:</span>

            {(['SC', 'RS', 'PR'] as const).map((region) => (
              <button
                key={region}
                onClick={() => handleFilterChange(region)}
                className={`h-8 px-3 rounded-xl text-xs font-bold transition-all ${
                  filterRegion === region
                    ? 'bg-indigo-600 text-white border-2 border-indigo-300'
                    : regionalCounts[region] > 0
                    ? 'bg-indigo-700/50 text-indigo-300 border border-indigo-600'
                    : 'bg-gray-800 text-gray-400 border border-gray-700'
                }`}
              >
                {region}: {regionalCounts[region]}
              </button>
            ))}
          </div>
        </header>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {MONTH_NAMES.map((name, index) => {
            const monthEvents = events[index] || {};
            let totalEventsCount = 0;
            let hasProximateEvent = false;

            Object.entries(monthEvents).forEach(([dayStr, dayEvents]) => {
              const day = parseInt(dayStr);
              const filteredEvents = dayEvents.filter(
                (e) => filterRegion === 'all' || e.region === filterRegion
              );
              totalEventsCount += filteredEvents.length;

              if (filteredEvents.length > 0 && !hasProximateEvent) {
                const eventDate = new Date(YEAR, index, day);
                const diffDays = Math.ceil(
                  (eventDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
                );
                if (diffDays >= 0 && diffDays <= PROXIMITY_DAYS) {
                  hasProximateEvent = true;
                }
              }
            });

            let cardStyle = '';
            let eventText = '';

            if (hasProximateEvent) {
              cardStyle =
                'border-red-500 bg-red-900/50 shadow-xl shadow-red-900/50 scale-[1.03]';
              eventText = `EVENTO PRÓXIMO! (${totalEventsCount} Evento${totalEventsCount !== 1 ? 's' : ''})`;
            } else if (totalEventsCount > 0) {
              cardStyle =
                'border-indigo-500 bg-indigo-900/50 shadow-xl shadow-indigo-900/50 scale-[1.03]';
              eventText = `${totalEventsCount} Evento${totalEventsCount !== 1 ? 's' : ''} Encontrado${totalEventsCount !== 1 ? 's' : ''}`;
            } else {
              cardStyle = 'border-gray-700 hover:bg-gray-800';
              eventText =
                filterRegion !== 'all'
                  ? `Sem eventos em ${filterRegion}`
                  : 'Clique para agendar eventos';
            }

            return (
              <div
                key={index}
                onClick={() => {
                  setSelectedMonth(index);
                  setCurrentView('monthly');
                }}
                className={`relative p-6 border-2 rounded-2xl cursor-pointer transition-all duration-300 ${cardStyle} text-gray-100`}
              >
                {hasProximateEvent && (
                  <span className="absolute top-2 right-2 flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-red-600"></span>
                  </span>
                )}
                {totalEventsCount > 0 && !hasProximateEvent && (
                  <span className="absolute top-2 right-2 flex h-3 w-3">
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-indigo-600"></span>
                  </span>
                )}
                <h2 className="text-xl font-bold text-gray-100">{name}</h2>
                <p className="text-sm text-gray-400 mt-1">{DAYS_IN_MONTH[index]} dias</p>
                <p
                  className={`text-sm font-semibold ${
                    hasProximateEvent ? 'text-red-300' : 'text-indigo-400'
                  } mt-3`}
                >
                  {eventText}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // Monthly View
  const monthName = MONTH_NAMES[selectedMonth];
  const daysInMonth = DAYS_IN_MONTH[selectedMonth];
  const firstDayOfMonth = new Date(YEAR, selectedMonth, 1).getDay();

  return (
    <div className="w-full max-w-5xl mx-auto">
      <div className="mb-6 flex justify-between items-center">
        <h2 className="text-3xl font-bold text-indigo-400">
          {monthName}, {YEAR}
        </h2>
        <button
          onClick={() => setCurrentView('annual')}
          className="px-4 py-2 bg-gray-700 text-gray-200 rounded-xl font-medium hover:bg-gray-600"
        >
          ← Voltar
        </button>
      </div>

      <div className="grid grid-cols-7 text-center font-semibold text-sm text-gray-400 border-b border-gray-700 pb-2 mb-2">
        {DAY_NAMES.map((day) => (
          <div key={day} className="p-2">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1 sm:gap-3">
        {Array.from({ length: firstDayOfMonth }).map((_, i) => (
          <div key={`empty-${i}`} className="p-2 aspect-square"></div>
        ))}

        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const dayKey = String(day);
          const dayEvents = events[selectedMonth]?.[dayKey] || [];
          const filteredDayEvents = dayEvents.filter(
            (e) => filterRegion === 'all' || e.region === filterRegion
          );

          const hasFilteredEvents = filteredDayEvents.length > 0;
          const eventDate = new Date(YEAR, selectedMonth, day);
          const diffDays = Math.ceil(
            (eventDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
          );
          const isProximate = hasFilteredEvents && diffDays >= 0 && diffDays <= PROXIMITY_DAYS;

          const isCurrentDay =
            today.getFullYear() === YEAR &&
            today.getMonth() === selectedMonth &&
            today.getDate() === day;

          let dayStyle = 'p-2 sm:p-3 text-center rounded-xl cursor-pointer transition-all relative aspect-square flex flex-col items-center justify-center';

          if (isCurrentDay) {
            dayStyle += ' border-2 border-red-500 bg-red-900 font-bold text-red-200';
          } else if (isProximate) {
            dayStyle += ' bg-red-800/70 border-2 border-red-600 font-medium text-white';
          } else if (hasFilteredEvents) {
            dayStyle += ' bg-indigo-800/70 border-2 border-indigo-600 font-medium text-white';
          } else {
            dayStyle += ' bg-gray-700 hover:bg-gray-600 text-gray-100';
          }

          return (
            <div
              key={day}
              onClick={() => openModal(selectedMonth, day)}
              className={dayStyle}
              title={`${day} de ${monthName}`}
            >
              <span className="text-lg leading-none">{day}</span>
              {isProximate && (
                <span className="absolute top-1 right-1 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-red-600"></span>
                </span>
              )}
            </div>
          );
        })}
      </div>

      {modalOpen && selectedDate && (
        <EventModal
          month={selectedDate.month}
          day={selectedDate.day}
          events={events[selectedDate.month]?.[String(selectedDate.day)] || []}
          onClose={closeModal}
          onAdd={addEvent}
          onDelete={deleteEvent}
        />
      )}
    </div>
  );
}
