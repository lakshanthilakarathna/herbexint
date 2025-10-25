import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Trophy, TrendingUp, Award } from 'lucide-react';

interface SalesRepPerformanceProps {
  orders: any[];
  dateRange: string;
}

export const SalesRepPerformance: React.FC<SalesRepPerformanceProps> = ({ orders, dateRange }) => {
  // Default sales reps
  const defaultReps = [
    { id: 'admin-user-id', name: 'Admin User' },
    { id: 'sales-rep-1', name: 'Sales Rep 1' },
    { id: 'sales-rep-2', name: 'Sales Rep 2' }
  ];

  // Get users from localStorage
  const users = JSON.parse(localStorage.getItem('users') || '[]');
  const salesReps = users.filter((u: any) => u.role_id === 'sales-rep-role-id');

  // Combine default and dynamic reps
  const allReps = [...defaultReps, ...salesReps];

  // Calculate metrics per rep
  const repPerformance = allReps.map(rep => {
    const repOrders = orders.filter((o: any) => o.created_by_user_id === rep.id);
    const totalSales = repOrders.reduce((sum, o) => sum + (o.total_amount || 0), 0);
    const orderCount = repOrders.length;
    const avgOrderValue = orderCount > 0 ? totalSales / orderCount : 0;

    return {
      repId: rep.id,
      repName: rep.name,
      totalSales,
      orderCount,
      avgOrderValue
    };
  })
    .filter(rep => rep.orderCount > 0) // Only show reps with orders
    .sort((a, b) => b.totalSales - a.totalSales);

  // Get max sales for percentage calculation
  const maxSales = repPerformance.length > 0 ? repPerformance[0].totalSales : 1;

  // Calculate total metrics
  const totalSales = repPerformance.reduce((sum, rep) => sum + rep.totalSales, 0);
  const totalOrders = repPerformance.reduce((sum, rep) => sum + rep.orderCount, 0);
  const avgSalesPerRep = repPerformance.length > 0 ? totalSales / repPerformance.length : 0;

  const getMedal = (index: number) => {
    if (index === 0) return '🥇';
    if (index === 1) return '🥈';
    if (index === 2) return '🥉';
    return '';
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sales Reps</CardTitle>
            <Users className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{repPerformance.length}</div>
            <p className="text-xs text-gray-500 mt-1">Active in {dateRange}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
            <TrendingUp className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Rs. {totalSales.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            <p className="text-xs text-gray-500 mt-1">From all reps</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Sales per Rep</CardTitle>
            <Trophy className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Rs. {avgSalesPerRep.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            <p className="text-xs text-gray-500 mt-1">Average across reps</p>
          </CardContent>
        </Card>
      </div>

      {/* Sales Rep Performance Comparison */}
      <Card>
        <CardHeader>
          <CardTitle>Sales Rep Performance Comparison</CardTitle>
        </CardHeader>
        <CardContent>
          {repPerformance.length > 0 ? (
            <div className="space-y-4">
              {repPerformance.map((rep, index) => {
                const percentage = maxSales > 0 ? (rep.totalSales / maxSales) * 100 : 0;
                return (
                  <div key={rep.repId} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{getMedal(index)}</span>
                        <Badge variant="secondary" className="w-8 h-8 flex items-center justify-center">
                          #{index + 1}
                        </Badge>
                        <span className="font-medium">{rep.repName}</span>
                      </div>
                      <span className="font-bold text-sm">
                        Rs. {rep.totalSales.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-amber-600 h-2 rounded-full" 
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-500">{percentage.toFixed(1)}%</span>
                    </div>
                    <div className="text-xs text-gray-500 flex gap-4">
                      <span>{rep.orderCount} orders</span>
                      <span>Avg: Rs. {rep.avgOrderValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No sales rep data for this period</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Top Performing Rep */}
      {repPerformance.length > 0 && (
        <Card className="bg-amber-50 border-amber-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5 text-amber-600" />
              Top Performing Sales Rep
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between p-4 bg-white rounded border border-amber-200">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-3xl">🥇</span>
                  <div>
                    <p className="font-bold text-lg">{repPerformance[0].repName}</p>
                    <p className="text-sm text-gray-500">{repPerformance[0].orderCount} orders</p>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p className="font-bold text-2xl text-amber-600">
                  Rs. {repPerformance[0].totalSales.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
                <p className="text-xs text-gray-500">
                  {maxSales > 0 ? ((repPerformance[0].totalSales / maxSales) * 100).toFixed(1) : 0}% of total sales
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
