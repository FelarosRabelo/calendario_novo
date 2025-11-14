'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import CalendarView from '@/components/calendar-view';

interface CalendarEvent {
  id: string;
  month_index: number;
  day: number;
  event_text: string;
  event_link: string | null;
  region: 'SC' | 'RS' | 'PR';
}

export default function Home() {
  const [events, setEvents] = useState<Record<number, Record<number, CalendarEvent[]>>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setError(null);
        console.log('[v0] Fetching events from Supabase...');
        
        const { data, error: fetchError } = await supabase
          .from('events')
          .select('*')
          .order('created_at', { ascending: true });

        if (fetchError) {
          console.error('[v0] Supabase error:', fetchError);
          throw fetchError;
        }

        console.log('[v0] Events fetched successfully:', data);

        // Transform flat array into hierarchical structure
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
        console.error('[v0] Error fetching events:', error);
        setError('Erro ao carregar eventos. Tente novamente em alguns momentos.');
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();

    // Subscribe to real-time updates
    const channel = supabase
      .channel('events_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'events' },
        (payload) => {
          console.log('[v0] Event change detected:', payload);
          fetchEvents();
        }
      )
      .subscribe((status) => {
        console.log('[v0] Subscription status:', status);
      });

    return () => {
      channel.unsubscribe();
    };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto mb-4"></div>
          <p className="text-gray-300">Carregando calendário...</p>
        </div>
      </div>
    );
  }

  return (
    <main className="bg-gray-900 min-h-screen p-4 sm:p-8">
      {error && (
        <div className="mb-4 p-4 bg-red-900 border border-red-700 rounded text-red-100">
          {error}
        </div>
      )}
      <CalendarView events={events} setEvents={setEvents} />
    </main>
  );
}
