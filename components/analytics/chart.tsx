'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface ChartProps {
  title: string;
  data: Array<{
    label: string;
    value: number;
    color?: string;
  }>;
  type: 'bar' | 'pie' | 'line' | 'doughnut';
  className?: string;
}

export function Chart({ title, data, type, className }: ChartProps) {
  const maxValue = Math.max(...data.map(d => d.value));
  const totalValue = data.reduce((sum, d) => sum + d.value, 0);

  const getColor = (index: number, defaultColor?: string) => {
    if (defaultColor) return defaultColor;

    const colors = [
      'bg-blue-500',
      'bg-green-500',
      'bg-yellow-500',
      'bg-red-500',
      'bg-purple-500',
      'bg-pink-500',
      'bg-indigo-500',
      'bg-gray-500'
    ];
    return colors[index % colors.length];
  };

  const renderBarChart = () => (
    <div className="space-y-3">
      {data.map((item, index) => (
        <div key={item.label} className="space-y-1">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">{item.label}</span>
            <span className="font-medium">{item.value}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={cn(
                'h-2 rounded-full transition-all duration-500',
                getColor(index, item.color)
              )}
              style={{
                width: `${maxValue > 0 ? (item.value / maxValue) * 100 : 0}%`
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );

  const renderPieChart = () => (
    <div className="flex flex-col items-center space-y-4">
      <div className="relative w-32 h-32">
        <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 32 32">
          {data.map((item, index) => {
            const percentage =
              totalValue > 0 ? (item.value / totalValue) * 100 : 0;
            const circumference = 2 * Math.PI * 15; // radius = 15
            const strokeDasharray = `${
              (percentage / 100) * circumference
            } ${circumference}`;
            const strokeDashoffset =
              index === 0
                ? 0
                : data
                    .slice(0, index)
                    .reduce(
                      (sum, d) => sum + (d.value / totalValue) * circumference,
                      0
                    );

            return (
              <circle
                key={item.label}
                cx="16"
                cy="16"
                r="15"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeDasharray={strokeDasharray}
                strokeDashoffset={-strokeDashoffset}
                className={cn(
                  'transition-all duration-500',
                  getColor(index, item.color)
                )}
              />
            );
          })}
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-sm font-medium text-gray-600">
            {totalValue}
          </span>
        </div>
      </div>
      <div className="space-y-2">
        {data.map((item, index) => (
          <div key={item.label} className="flex items-center space-x-2">
            <div
              className={cn(
                'w-3 h-3 rounded-full',
                getColor(index, item.color)
              )}
            />
            <span className="text-sm text-gray-600">{item.label}</span>
            <span className="text-sm font-medium">{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );

  const renderLineChart = () => (
    <div className="space-y-3">
      <div className="h-32 flex items-end space-x-2">
        {data.map((item, index) => (
          <div
            key={item.label}
            className="flex flex-col items-center space-y-1">
            <div
              className={cn(
                'w-8 rounded-t transition-all duration-500',
                getColor(index, item.color)
              )}
              style={{
                height: `${maxValue > 0 ? (item.value / maxValue) * 100 : 0}%`
              }}
            />
            <span className="text-xs text-gray-500">{item.label}</span>
          </div>
        ))}
      </div>
      <div className="flex justify-between text-xs text-gray-500">
        <span>0</span>
        <span>{maxValue}</span>
      </div>
    </div>
  );

  const renderDoughnutChart = () => (
    <div className="flex flex-col items-center space-y-4">
      <div className="relative w-32 h-32">
        <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 32 32">
          {data.map((item, index) => {
            const percentage =
              totalValue > 0 ? (item.value / totalValue) * 100 : 0;
            const circumference = 2 * Math.PI * 12; // radius = 12
            const strokeDasharray = `${
              (percentage / 100) * circumference
            } ${circumference}`;
            const strokeDashoffset =
              index === 0
                ? 0
                : data
                    .slice(0, index)
                    .reduce(
                      (sum, d) => sum + (d.value / totalValue) * circumference,
                      0
                    );

            return (
              <circle
                key={item.label}
                cx="16"
                cy="16"
                r="12"
                fill="none"
                stroke="currentColor"
                strokeWidth="4"
                strokeDasharray={strokeDasharray}
                strokeDashoffset={-strokeDashoffset}
                className={cn(
                  'transition-all duration-500',
                  getColor(index, item.color)
                )}
              />
            );
          })}
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="text-lg font-bold text-gray-800">{totalValue}</div>
            <div className="text-xs text-gray-500">Total</div>
          </div>
        </div>
      </div>
      <div className="space-y-2">
        {data.map((item, index) => (
          <div key={item.label} className="flex items-center space-x-2">
            <div
              className={cn(
                'w-3 h-3 rounded-full',
                getColor(index, item.color)
              )}
            />
            <span className="text-sm text-gray-600">{item.label}</span>
            <span className="text-sm font-medium">{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );

  const renderChart = () => {
    switch (type) {
      case 'bar':
        return renderBarChart();
      case 'pie':
        return renderPieChart();
      case 'line':
        return renderLineChart();
      case 'doughnut':
        return renderDoughnutChart();
      default:
        return renderBarChart();
    }
  };

  return (
    <Card
      className={cn(
        'bg-white/70 backdrop-blur-sm border-blue-200/50 shadow-lg hover:shadow-xl transition-all duration-200',
        className
      )}>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold text-blue-700">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <div className="text-sm">No data available</div>
          </div>
        ) : (
          renderChart()
        )}
      </CardContent>
    </Card>
  );
}
