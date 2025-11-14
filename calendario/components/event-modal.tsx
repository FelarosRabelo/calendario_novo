'use client';

import { useState } from 'react';

interface CalendarEvent {
  id: string;
  month_index: number;
  day: number;
  event_text: string;
  event_link: string | null;
  region: 'SC' | 'RS' | 'PR';
}

interface EventModalProps {
  month: number;
  day: number;
  events: CalendarEvent[];
  onClose: () => void;
  onAdd: (eventData: { text: string; link: string; region: 'SC' | 'RS' | 'PR' }) => void;
  onDelete: (eventId: string) => void;
}

const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];
const DAY_NAMES = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

export default function EventModal({
  month,
  day,
  events,
  onClose,
  onAdd,
  onDelete,
}: EventModalProps) {
  const [eventText, setEventText] = useState('');
  const [eventLink, setEventLink] = useState('');
  const [eventRegion, setEventRegion] = useState<'SC' | 'RS' | 'PR'>('SC');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventText || !eventRegion) return;
    onAdd({ text: eventText, link: eventLink, region: eventRegion });
    setEventText('');
    setEventLink('');
    setEventRegion('SC');
  };

  const eventDate = new Date(2026, month, day);
  const dateStr = `${DAY_NAMES[eventDate.getDay()]}, ${day} de ${MONTH_NAMES[month]} de 2026`;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4 z-50"
      onClick={onClose}
    >
      <div
        className="bg-gray-800 text-gray-100 p-6 rounded-2xl shadow-2xl w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-2xl font-bold mb-2 text-indigo-400">Adicionar Novo Evento</h2>
        <p className="text-gray-400 mb-4">{dateStr}</p>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Descrição do Evento:
            </label>
            <input
              type="text"
              required
              value={eventText}
              onChange={(e) => setEventText(e.target.value)}
              placeholder="Ex: Conferência Indústria 4.0"
              className="w-full p-3 border border-gray-600 bg-gray-700 text-white rounded-xl focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Link (Opcional):
            </label>
            <input
              type="url"
              value={eventLink}
              onChange={(e) => setEventLink(e.target.value)}
              placeholder="https://www.site-do-evento.com.br"
              className="w-full p-3 border border-gray-600 bg-gray-700 text-white rounded-xl focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Região do Evento:
            </label>
            <select
              required
              value={eventRegion}
              onChange={(e) => setEventRegion(e.target.value as 'SC' | 'RS' | 'PR')}
              className="w-full p-3 border border-gray-600 bg-gray-700 text-white rounded-xl focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="SC">Santa Catarina (SC)</option>
              <option value="RS">Rio Grande do Sul (RS)</option>
              <option value="PR">Paraná (PR)</option>
            </select>
          </div>

          {events.length > 0 && (
            <div className="mb-4 p-3 bg-gray-700 rounded-xl max-h-40 overflow-y-auto">
              <h3 className="font-semibold text-indigo-400 mb-2">Eventos Existentes:</h3>
              <ul className="space-y-2">
                {events.map((event) => (
                  <li
                    key={event.id}
                    className="flex justify-between items-center bg-gray-600 p-2 rounded-lg"
                  >
                    <div>
                      <span className="text-gray-100">{event.event_text}</span>
                      {event.event_link && (
                        <a
                          href={event.event_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-indigo-400 hover:text-indigo-300 ml-2"
                        >
                          🔗
                        </a>
                      )}
                      <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-indigo-600 text-white ml-2">
                        {event.region}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => onDelete(event.id)}
                      className="text-red-400 hover:text-red-500 text-lg"
                    >
                      ×
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex justify-end space-x-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 border border-gray-600 bg-gray-700 rounded-xl text-gray-200 hover:bg-gray-600"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700"
            >
              Salvar Evento
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
