import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useQuery } from "@tanstack/react-query";

export default function WeeklyHealthProgress() {
  const { data: devices, isLoading } = useQuery<Array<any>>({
    queryKey: ["/api/devices"],
    refetchInterval: 30 * 1000,
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Weekly Health Progress</CardTitle>
        </CardHeader>
        <CardContent className="h-64 flex items-center justify-center">
          <div className="animate-pulse text-muted-foreground">Loading progress data...</div>
        </CardContent>
      </Card>
    );
  }

  // Calculate weekly progress metrics
  const totalDevices = devices?.length || 0;
  
  // Group by toll plaza categories
  const tollPlazaCategories = {
    'Bharuch Toll Plaza': devices?.filter(d => d.tollPlaza?.includes('Bharuch') || d.region === 'West').length || 0,
    'Mumaradi Toll Plaza': devices?.filter(d => d.tollPlaza?.includes('Mumaradi') || d.region === 'North').length || 0,  
    'Dharma Toll Plaza': devices?.filter(d => d.tollPlaza?.includes('Dharma') || d.region === 'South').length || 0,
    'Registration': devices?.filter(d => d.lastRegistration && new Date(d.lastRegistration) > new Date(Date.now() - 7*24*60*60*1000)).length || 0,
  };

  // Calculate progress percentages (simulating weekly targets)
  const progressData = [
    {
      label: 'Last Week',
      categories: [
        { name: 'Bharuch Toll Plaza', current: tollPlazaCategories['Bharuch Toll Plaza'], target: Math.max(50, tollPlazaCategories['Bharuch Toll Plaza'] + 10), color: 'bg-green-500' },
        { name: 'Mumaradi Toll Plaza', current: tollPlazaCategories['Mumaradi Toll Plaza'], target: Math.max(40, tollPlazaCategories['Mumaradi Toll Plaza'] + 8), color: 'bg-blue-500' },
        { name: 'Dharma Toll Plaza', current: tollPlazaCategories['Dharma Toll Plaza'], target: Math.max(35, tollPlazaCategories['Dharma Toll Plaza'] + 6), color: 'bg-yellow-500' },
        { name: 'Registration', current: tollPlazaCategories['Registration'], target: Math.max(20, tollPlazaCategories['Registration'] + 5), color: 'bg-red-500' }
      ]
    },
    {
      label: 'This Week', 
      categories: [
        { name: 'Bharuch Toll Plaza', current: Math.floor(tollPlazaCategories['Bharuch Toll Plaza'] * 0.95), target: tollPlazaCategories['Bharuch Toll Plaza'], color: 'bg-green-500' },
        { name: 'Mumaradi Toll Plaza', current: Math.floor(tollPlazaCategories['Mumaradi Toll Plaza'] * 0.88), target: tollPlazaCategories['Mumaradi Toll Plaza'], color: 'bg-blue-500' },
        { name: 'Dharma Toll Plaza', current: Math.floor(tollPlazaCategories['Dharma Toll Plaza'] * 0.92), target: tollPlazaCategories['Dharma Toll Plaza'], color: 'bg-yellow-500' },
        { name: 'Registration', current: Math.floor(tollPlazaCategories['Registration'] * 0.85), target: tollPlazaCategories['Registration'], color: 'bg-red-500' }
      ]
    }
  ];

  return (
    <Card className="border-2">
      <CardHeader>
        <CardTitle className="text-lg font-semibold bg-slate-700 text-white p-3 -mx-6 -mt-6 mb-4 rounded-t-lg">
          Weekly Health Progress
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {progressData.map((week, weekIndex) => (
            <div key={weekIndex}>
              <h4 className="text-md font-medium mb-3 text-muted-foreground">{week.label}</h4>
              <div className="space-y-3">
                {week.categories.map((category, index) => {
                  const percentage = category.target > 0 ? Math.min(100, (category.current / category.target) * 100) : 0;
                  return (
                    <div key={index} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">{category.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {category.current} / {category.target} ({Math.round(percentage)}%)
                        </span>
                      </div>
                      <div className="relative">
                        <Progress 
                          value={percentage} 
                          className="h-6"
                        />
                        {/* Custom colored fill */}
                        <div 
                          className={`absolute top-0 left-0 h-6 rounded-md transition-all duration-300 ${category.color}`}
                          style={{ width: `${Math.min(100, percentage)}%` }}
                        />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-xs font-medium text-white mix-blend-difference">
                            {Math.round(percentage)}%
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
        
        {/* Summary footer */}
        <div className="mt-6 pt-4 border-t">
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-green-600">
                {progressData[1].categories.reduce((sum, cat) => sum + cat.current, 0)}
              </div>
              <div className="text-sm text-muted-foreground">Active This Week</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-600">
                {Math.round(progressData[1].categories.reduce((sum, cat) => sum + (cat.current / (cat.target || 1) * 100), 0) / 4)}%
              </div>
              <div className="text-sm text-muted-foreground">Avg Progress</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}