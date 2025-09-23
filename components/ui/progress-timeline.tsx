'use client';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import {
  Clock,
  CheckCircle,
  AlertTriangle,
  User,
  Calendar,
  MessageSquare,
  DollarSign
} from 'lucide-react';

interface TimelineEvent {
  id: string;
  type:
    | 'created'
    | 'assigned'
    | 'in_progress'
    | 'completed'
    | 'cancelled'
    | 'note'
    | 'cost_update';
  title: string;
  description?: string;
  timestamp: string;
  user?: {
    name: string;
    role: string;
  };
  data?: any;
}

interface ProgressTimelineProps {
  events: TimelineEvent[];
  currentStatus: string;
  className?: string;
}

const statusConfig = {
  pending: {
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-100',
    icon: Clock,
    label: 'Pending'
  },
  in_progress: {
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    icon: AlertTriangle,
    label: 'In Progress'
  },
  completed: {
    color: 'text-green-600',
    bgColor: 'bg-green-100',
    icon: CheckCircle,
    label: 'Completed'
  },
  cancelled: {
    color: 'text-red-600',
    bgColor: 'bg-red-100',
    icon: AlertTriangle,
    label: 'Cancelled'
  }
};

const eventConfig = {
  created: {
    icon: Clock,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50'
  },
  assigned: {
    icon: User,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50'
  },
  in_progress: {
    icon: AlertTriangle,
    color: 'text-orange-600',
    bgColor: 'bg-orange-50'
  },
  completed: {
    icon: CheckCircle,
    color: 'text-green-600',
    bgColor: 'bg-green-50'
  },
  cancelled: {
    icon: AlertTriangle,
    color: 'text-red-600',
    bgColor: 'bg-red-50'
  },
  note: {
    icon: MessageSquare,
    color: 'text-gray-600',
    bgColor: 'bg-gray-50'
  },
  cost_update: {
    icon: DollarSign,
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-50'
  }
};

export function ProgressTimeline({
  events,
  currentStatus,
  className
}: ProgressTimelineProps) {
  const sortedEvents = [...events].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  const getEventIcon = (type: string) => {
    const config = eventConfig[type as keyof typeof eventConfig];
    return config?.icon || Clock;
  };

  const getEventColor = (type: string) => {
    const config = eventConfig[type as keyof typeof eventConfig];
    return config?.color || 'text-gray-600';
  };

  const getEventBgColor = (type: string) => {
    const config = eventConfig[type as keyof typeof eventConfig];
    return config?.bgColor || 'bg-gray-50';
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return {
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
  };

  return (
    <Card
      className={cn(
        'bg-white/70 backdrop-blur-sm border-blue-200/50 shadow-lg',
        className
      )}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-blue-700">
          <Clock className="w-5 h-5" />
          Resolution Progress
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Current Status */}
        <div className="flex items-center gap-3 p-4 bg-blue-50/50 rounded-lg border border-blue-200/50">
          <div
            className={cn(
              'w-10 h-10 rounded-full flex items-center justify-center',
              statusConfig[currentStatus as keyof typeof statusConfig]
                ?.bgColor || 'bg-gray-100'
            )}>
            {(() => {
              const Icon =
                statusConfig[currentStatus as keyof typeof statusConfig]
                  ?.icon || Clock;
              return (
                <Icon
                  className={cn(
                    'w-5 h-5',
                    statusConfig[currentStatus as keyof typeof statusConfig]
                      ?.color || 'text-gray-600'
                  )}
                />
              );
            })()}
          </div>
          <div>
            <p className="font-semibold text-gray-900">
              Current Status:{' '}
              {statusConfig[currentStatus as keyof typeof statusConfig]
                ?.label || currentStatus}
            </p>
            <p className="text-sm text-gray-600">
              Last updated:{' '}
              {sortedEvents.length > 0
                ? formatTimestamp(sortedEvents[0].timestamp).date
                : 'N/A'}
            </p>
          </div>
        </div>

        {/* Timeline */}
        <div className="space-y-4">
          {sortedEvents.map((event, index) => {
            const Icon = getEventIcon(event.type);
            const isLast = index === sortedEvents.length - 1; // Last in the list (oldest chronologically)
            const { date, time } = formatTimestamp(event.timestamp);

            return (
              <div key={event.id} className="flex gap-4">
                {/* Timeline Line */}
                <div className="flex flex-col items-center">
                  <div
                    className={cn(
                      'w-8 h-8 rounded-full flex items-center justify-center border-2 border-white shadow-sm',
                      getEventBgColor(event.type)
                    )}>
                    <Icon
                      className={cn('w-4 h-4', getEventColor(event.type))}
                    />
                  </div>
                  {!isLast && <div className="w-0.5 h-8 bg-gray-200 mt-2" />}
                </div>

                {/* Event Content */}
                <div className="flex-1 pb-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900">
                        {event.title}
                      </h4>
                      {event.description && (
                        <p className="text-sm text-gray-600 mt-1">
                          {event.description}
                        </p>
                      )}
                      {event.user && (
                        <div className="flex items-center gap-2 mt-2">
                          <User className="w-3 h-3 text-gray-400" />
                          <span className="text-xs text-gray-500">
                            {event.user.name} ({event.user.role})
                          </span>
                        </div>
                      )}
                      {event.data && (
                        <div className="mt-2 space-y-1">
                          {event.data.cost && (
                            <div className="flex items-center gap-2">
                              <DollarSign className="w-3 h-3 text-gray-400" />
                              <span className="text-xs text-gray-500">
                                Cost: ₱{event.data.cost.toLocaleString()}
                              </span>
                            </div>
                          )}
                          {event.data.assignedTo && (
                            <div className="flex items-center gap-2">
                              <User className="w-3 h-3 text-gray-400" />
                              <span className="text-xs text-gray-500">
                                Assigned to: {event.data.assignedTo}
                              </span>
                            </div>
                          )}
                          {event.data.scheduledDate && (
                            <div className="flex items-center gap-2">
                              <Calendar className="w-3 h-3 text-gray-400" />
                              <span className="text-xs text-gray-500">
                                Scheduled:{' '}
                                {new Date(
                                  event.data.scheduledDate
                                ).toLocaleDateString()}
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500">{date}</p>
                      <p className="text-xs text-gray-400">{time}</p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Empty State */}
        {sortedEvents.length === 0 && (
          <div className="text-center py-8">
            <Clock className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500">No progress events yet</p>
            <p className="text-sm text-gray-400">
              Updates will appear here as the request progresses
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
