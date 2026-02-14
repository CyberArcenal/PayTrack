// src/renderer/pages/Dashboard/Dashboard.tsx
import React, { useEffect, useState } from 'react';
import {
  Users,
  Clock,
  DollarSign,
  TrendingUp,
  Calendar,
  UserPlus,
  LogIn,
  CreditCard,
  Download,
  ArrowUpRight,
  AlertCircle,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import dashboardAPI, { type DashboardData } from '../../api/dashboard';

// ----------------------------------------------------------------------
// Helper Components
// ----------------------------------------------------------------------

const StatCard: React.FC<{
  title: string;
  value: number | string;
  icon: React.ElementType;
  prefix?: string;
  suffix?: string;
  trend?: number;
  color?: 'gold' | 'blue' | 'green' | 'purple';
}> = ({ title, value, icon: Icon, prefix = '', suffix = '', trend, color = 'gold' }) => {
  const colorMap = {
    gold: 'var(--primary-color)',
    blue: 'var(--brand-sky)',
    green: 'var(--brand-teal)',
    purple: '#a78bfa',
  };
  const bgColor = colorMap[color];

  return (
    <div className="windows-card p-5 flex items-start justify-between" style={{ background: 'var(--card-bg)' }}>
      <div>
        <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
          {title}
        </p>
        <p className="text-2xl font-bold mt-1" style={{ color: 'var(--text-primary)' }}>
          {prefix}
          {typeof value === 'number' ? value.toLocaleString() : value}
          {suffix}
        </p>
        {trend !== undefined && (
          <p className="text-xs mt-2 flex items-center" style={{ color: trend >= 0 ? '#10b981' : '#ef4444' }}>
            <TrendingUp className="w-3 h-3 mr-1" />
            {trend > 0 ? '+' : ''}
            {trend}% from last month
          </p>
        )}
      </div>
      <div className="p-3 rounded-lg" style={{ background: `rgba(${bgColor},0.1)` }}>
        <Icon className="w-6 h-6" style={{ color: bgColor }} />
      </div>
    </div>
  );
};

const QuickActions: React.FC = () => (
  <div className="windows-card p-4" style={{ background: 'var(--card-bg)' }}>
    <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-secondary)' }}>
      Quick Actions
    </h3>
    <div className="flex flex-wrap gap-2">
      <button className="windows-btn windows-btn-primary text-sm flex items-center gap-1">
        <UserPlus className="w-4 h-4" /> Add Employee
      </button>
      <button className="windows-btn windows-btn-primary text-sm flex items-center gap-1">
        <LogIn className="w-4 h-4" /> Log Attendance
      </button>
      <button className="windows-btn windows-btn-primary text-sm flex items-center gap-1">
        <CreditCard className="w-4 h-4" /> Process Payroll
      </button>
      <button className="windows-btn windows-btn-secondary text-sm flex items-center gap-1">
        <Download className="w-4 h-4" /> Export Reports
      </button>
    </div>
  </div>
);

const AttendanceTodayCard: React.FC<{ data: DashboardData['attendanceToday'] }> = ({ data }) => {
  const items = [
    { label: 'Present', value: data.present, color: '#10b981' },
    { label: 'Late', value: data.late, color: '#f59e0b' },
    { label: 'Half Day', value: data.halfDay, color: '#8b5cf6' },
    { label: 'Absent', value: data.absent, color: '#ef4444' },
    { label: 'Others', value: data.others, color: '#6b7280' },
  ];

  return (
    <div className="windows-card p-5" style={{ background: 'var(--card-bg)' }}>
      <h3 className="text-md font-semibold flex items-center gap-2 mb-4" style={{ color: 'var(--text-primary)' }}>
        <Clock className="w-5 h-5" style={{ color: 'var(--primary-color)' }} />
        Today's Attendance Snapshot
      </h3>
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mb-4">
        {items.map((item) => (
          <div key={item.label} className="text-center p-2 rounded" style={{ background: 'var(--card-secondary-bg)' }}>
            <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{item.label}</p>
            <p className="text-lg font-bold" style={{ color: item.color }}>{item.value}</p>
          </div>
        ))}
      </div>
      <div className="flex justify-between text-sm">
        <span style={{ color: 'var(--text-secondary)' }}>Total Employees: {data.total}</span>
        <span style={{ color: 'var(--text-secondary)' }}>Hours Worked: {data.totalHoursWorked.toFixed(1)}</span>
      </div>
    </div>
  );
};

const PayrollSummaryCard: React.FC<{ summary: DashboardData['payrollSummary']; upcoming: string | null; pending: number }> = ({
  summary,
  upcoming,
  pending,
}) => {
  if (!summary?.latestPeriod) {
    return (
      <div className="windows-card p-5" style={{ background: 'var(--card-bg)' }}>
        <p style={{ color: 'var(--text-tertiary)' }}>No payroll data available</p>
      </div>
    );
  }

  return (
    <div className="windows-card p-5" style={{ background: 'var(--card-bg)' }}>
      <h3 className="text-md font-semibold flex items-center gap-2 mb-4" style={{ color: 'var(--text-primary)' }}>
        <DollarSign className="w-5 h-5" style={{ color: 'var(--primary-color)' }} />
        Latest Payroll: {summary.latestPeriod.name}
      </h3>
      <div className="space-y-3">
        <div className="flex justify-between">
          <span style={{ color: 'var(--text-secondary)' }}>Gross Pay</span>
          <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>
            ${summary.latestPeriod.totalGross.toLocaleString()}
          </span>
        </div>
        <div className="flex justify-between">
          <span style={{ color: 'var(--text-secondary)' }}>Net Pay</span>
          <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>
            ${summary.latestPeriod.totalNet.toLocaleString()}
          </span>
        </div>
        <div className="flex justify-between">
          <span style={{ color: 'var(--text-secondary)' }}>Employees</span>
          <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>
            {summary.latestPeriod.employeeCount}
          </span>
        </div>
        {summary.comparison && (
          <div className="flex justify-between text-sm">
            <span style={{ color: 'var(--text-secondary)' }}>vs last period</span>
            <span style={{ color: summary.comparison.grossChangePercent >= 0 ? '#10b981' : '#ef4444' }}>
              {summary.comparison.grossChangePercent > 0 ? '+' : ''}
              {summary.comparison.grossChangePercent}% gross
            </span>
          </div>
        )}
        <div className="border-t pt-3 mt-3" style={{ borderColor: 'var(--border-color)' }}>
          <div className="flex justify-between">
            <span style={{ color: 'var(--text-secondary)' }}>Upcoming pay date</span>
            <span className="font-medium" style={{ color: 'var(--primary-color)' }}>
              {upcoming ? new Date(upcoming).toLocaleDateString() : 'Not scheduled'}
            </span>
          </div>
          <div className="flex justify-between mt-1">
            <span style={{ color: 'var(--text-secondary)' }}>Pending periods</span>
            <span className="font-medium" style={{ color: pending > 0 ? '#f59e0b' : '#10b981' }}>
              {pending}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

const AttendanceTrendChart: React.FC<{ data: DashboardData['attendanceTrend'] }> = ({ data }) => {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border-light)" />
        <XAxis dataKey="date" stroke="var(--text-tertiary)" tick={{ fill: 'var(--text-tertiary)', fontSize: 12 }} />
        <YAxis stroke="var(--text-tertiary)" tick={{ fill: 'var(--text-tertiary)', fontSize: 12 }} />
        <Tooltip
          contentStyle={{ background: 'var(--card-bg)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
        />
        <Legend wrapperStyle={{ color: 'var(--text-secondary)' }} />
        <Line type="monotone" dataKey="present" stroke="#10b981" strokeWidth={2} dot={false} />
        <Line type="monotone" dataKey="late" stroke="#f59e0b" strokeWidth={2} dot={false} />
        <Line type="monotone" dataKey="absent" stroke="#ef4444" strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
};

const DepartmentDistributionChart: React.FC<{ data: DashboardData['departmentDistribution'] }> = ({ data }) => {
  const COLORS = ['var(--primary-color)', 'var(--brand-teal)', 'var(--brand-sky)', '#a78bfa', '#f472b6'];

  return (
    <ResponsiveContainer width="100%" height={200}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={80}
          paddingAngle={2}
          dataKey="count"
          nameKey="department"
          label={(entry) => entry.department}
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{ background: 'var(--card-bg)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
};

const RecentActivityTable: React.FC<{ activities: DashboardData['recentActivity'] }> = ({ activities }) => {
  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'present':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'absent':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'late':
        return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  return (
    <div className="windows-card p-5" style={{ background: 'var(--card-bg)' }}>
      <h3 className="text-md font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
        Recent Activity
      </h3>
      <div className="overflow-x-auto">
        <table className="windows-table">
          <thead>
            <tr>
              <th>Employee</th>
              <th>Time</th>
              <th>Status</th>
              <th>Source</th>
            </tr>
          </thead>
          <tbody>
            {activities.slice(0, 5).map((act) => (
              <tr key={act.id}>
                <td className="font-medium" style={{ color: 'var(--text-primary)' }}>
                  {act.employeeName}
                </td>
                <td style={{ color: 'var(--text-secondary)' }}>
                  {new Date(act.timestamp).toLocaleTimeString()}
                </td>
                <td>
                  <div className="flex items-center gap-1">
                    {getStatusIcon(act.status)}
                    <span style={{ color: 'var(--text-secondary)' }}>{act.status}</span>
                  </div>
                </td>
                <td style={{ color: 'var(--text-secondary)' }}>{act.source}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const TopEmployeesCard: React.FC<{ employees: DashboardData['topEmployeesByAttendance'] }> = ({ employees }) => {
  return (
    <div className="windows-card p-5" style={{ background: 'var(--card-bg)' }}>
      <h3 className="text-md font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
        Top Attendance (This Month)
      </h3>
      <div className="space-y-3">
        {employees.slice(0, 5).map((emp, idx) => (
          <div key={emp.employeeId} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-5 text-sm font-medium" style={{ color: 'var(--text-tertiary)' }}>
                #{idx + 1}
              </span>
              <span style={{ color: 'var(--text-primary)' }}>{emp.employeeName}</span>
            </div>
            <span className="text-sm font-semibold" style={{ color: 'var(--primary-color)' }}>
              {emp.presentCount} days
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

// ----------------------------------------------------------------------
// Main Dashboard Component
// ----------------------------------------------------------------------

const Dashboard: React.FC = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setLoading(true);
        const response = await dashboardAPI.getDashboardData();
        if (response.status) {
          setData(response.data);
          setError(null);
        } else {
          setError('Failed to load dashboard data');
        }
      } catch (err: any) {
        setError(err.message || 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
    const interval = setInterval(fetchDashboard, 300000); // refresh every 5 min
    return () => clearInterval(interval);
  }, []);

  // Loading skeleton
  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="animate-pulse">
          <div className="h-8 w-48 rounded bg-gray-700 mb-6" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 rounded-xl bg-gray-800" />
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mt-6">
            <div className="lg:col-span-2 h-96 rounded-xl bg-gray-800" />
            <div className="h-96 rounded-xl bg-gray-800" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-6 flex items-center justify-center h-full">
        <div className="windows-card p-8 text-center max-w-md" style={{ background: 'var(--card-bg)' }}>
          <p className="text-lg font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
            ⚠️ Dashboard Unavailable
          </p>
          <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
            {error || 'No data received'}
          </p>
          <button onClick={() => window.location.reload()} className="windows-btn windows-btn-primary px-5 py-2">
            Retry
          </button>
        </div>
      </div>
    );
  }

  const {
    employeeStats,
    attendanceToday,
    payrollSummary,
    upcomingPayDate,
    pendingPeriods,
    attendanceTrend,
    recentActivity,
    departmentDistribution,
    topEmployeesByAttendance,
    overtimeSummary,
  } = data;

  return (
    <div className="p-2 space-y-6 windows-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold windows-title" style={{ color: 'var(--text-primary)' }}>
            Dashboard
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
            Welcome back! Here's your company overview.
          </p>
        </div>
        <div
          className="flex items-center gap-3 px-4 py-2 rounded-lg"
          style={{
            background: 'rgba(212,175,55,0.1)',
            border: '1px solid var(--border-color)',
            color: 'var(--text-secondary)',
          }}
        >
          <Clock className="w-4 h-4" style={{ color: 'var(--primary-color)' }} />
          <span className="text-sm font-medium">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          title="Total Employees"
          value={employeeStats.total}
          icon={Users}
          trend={employeeStats.newHiresThisMonth}
          color="gold"
        />
        <StatCard
          title="Active Employees"
          value={employeeStats.active}
          icon={CheckCircle}
          color="green"
        />
        <StatCard
          title="On Leave"
          value={employeeStats.onLeave}
          icon={Clock}
          color="blue"
        />
        <StatCard
          title="Overtime Hours"
          value={overtimeSummary.totalOvertimeHours}
          icon={TrendingUp}
          suffix="h"
          color="purple"
        />
      </div>

      {/* Quick Actions */}
      <QuickActions />

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left Column (2/3) */}
        <div className="lg:col-span-2 space-y-5">
          <AttendanceTodayCard data={attendanceToday} />

          <div className="windows-card p-5" style={{ background: 'var(--card-bg)' }}>
            <h3 className="text-md font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
              <TrendingUp className="w-5 h-5" style={{ color: 'var(--primary-color)' }} />
              Attendance Trend (Last 7 Days)
            </h3>
            <AttendanceTrendChart data={attendanceTrend} />
          </div>

          <RecentActivityTable activities={recentActivity} />
        </div>

        {/* Right Column (1/3) */}
        <div className="space-y-5">
          <PayrollSummaryCard summary={payrollSummary} upcoming={upcomingPayDate} pending={pendingPeriods} />

          <div className="windows-card p-5" style={{ background: 'var(--card-bg)' }}>
            <h3 className="text-md font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
              <Users className="w-5 h-5" style={{ color: 'var(--primary-color)' }} />
              Department Distribution
            </h3>
            <DepartmentDistributionChart data={departmentDistribution} />
          </div>

          <TopEmployeesCard employees={topEmployeesByAttendance} />

          <div className="windows-card p-5" style={{ background: 'var(--card-bg)' }}>
            <h3 className="text-md font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
              Overtime Summary
            </h3>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              Total hours: <span className="font-bold text-lg" style={{ color: 'var(--primary-color)' }}>
                {overtimeSummary.totalOvertimeHours}
              </span>
            </p>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              Employees with overtime: {overtimeSummary.employeesWithOvertime}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;