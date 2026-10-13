import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { formatFeeAmount } from '../utils/currency';

const AdminAnalyticsInsights = ({ financials, totalExams, totalHomeworks, totalParents, attendanceRate }) => {
  const feeChartData = [
    { name: 'Collected', value: Math.max(0, Number(financials.totalCollected) || 0), color: '#0f9f79' },
    { name: 'Pending', value: Math.max(0, Number(financials.totalPending) || 0), color: '#e7a32d' },
  ];
  const hasFeeChartData = feeChartData.some((entry) => entry.value > 0);

  return (
    <section className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1.2fr)_minmax(280px,0.8fr)]">
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
        <div className="mb-3 flex items-start justify-between gap-3">
          <div>
            <h3 className="font-bold text-slate-800">Fee collection mix</h3>
            <p className="mt-1 text-xs text-slate-500">Collected versus pending from current invoices</p>
          </div>
          <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-semibold text-emerald-800">Live totals</span>
        </div>
        {hasFeeChartData ? (
          <div className="grid grid-cols-1 items-center gap-2 sm:grid-cols-[minmax(180px,0.9fr)_minmax(160px,1.1fr)]">
            <div className="h-56 min-w-0" aria-label="Fee collection donut chart">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={feeChartData} dataKey="value" nameKey="name" innerRadius={58} outerRadius={82} paddingAngle={4} stroke="none">
                    {feeChartData.map((entry) => <Cell key={entry.name} fill={entry.color} />)}
                  </Pie>
                  <Tooltip formatter={(value) => formatFeeAmount(value)} />
                  <Legend verticalAlign="bottom" height={30} iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-3">
              {feeChartData.map((entry) => (
                <div key={entry.name} className="flex items-center justify-between gap-3 border-b border-slate-100 pb-3 last:border-0">
                  <span className="flex items-center gap-2 text-sm text-slate-600">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
                    {entry.name}
                  </span>
                  <strong className="text-sm text-slate-800">{formatFeeAmount(entry.value)}</strong>
                </div>
              ))}
              <p className="text-xs text-slate-500">Recovery rate: {financials.collectionRate}</p>
            </div>
          </div>
        ) : (
          <div className="flex h-56 items-center justify-center rounded-lg bg-slate-50 text-sm text-slate-500">
            No fee data available yet.
          </div>
        )}
      </div>
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
        <h3 className="font-bold text-slate-800">School activity</h3>
        <p className="mt-1 text-xs text-slate-500">Current workload snapshot</p>
        <div className="mt-5 space-y-4">
          {[
            { label: 'Scheduled exams', value: totalExams, color: '#5677cc' },
            { label: 'Published homework', value: totalHomeworks, color: '#0f9f79' },
            { label: 'Registered parents', value: totalParents, color: '#e7a32d' },
          ].map((metric) => (
            <div key={metric.label}>
              <div className="mb-1.5 flex justify-between text-xs">
                <span className="text-slate-600">{metric.label}</span>
                <strong className="text-slate-800">{metric.value}</strong>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                <div className="h-full rounded-full" style={{ width: `${Math.min(100, Math.max(4, Number(metric.value) || 0))}%`, backgroundColor: metric.color }} />
              </div>
            </div>
          ))}
        </div>
        <p className="mt-5 rounded-lg bg-slate-50 p-3 text-xs text-slate-500">Attendance average: <strong className="text-slate-700">{attendanceRate}</strong></p>
      </div>
    </section>
  );
};

export default AdminAnalyticsInsights;