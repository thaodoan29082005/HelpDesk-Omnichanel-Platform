import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const ticketsByDay = [
  { day: "T2", tickets: 38 },
  { day: "T3", tickets: 56 },
  { day: "T4", tickets: 45 },
  { day: "T5", tickets: 70 },
  { day: "T6", tickets: 60 },
  { day: "T7", tickets: 83 },
  { day: "CN", tickets: 68 },
];

const messageSources = [
  { name: "Web", value: 46, color: "#32805d" },
  { name: "Email", value: 34, color: "#dc9454" },
  { name: "Telegram", value: 20, color: "#5685a0" },
];

export function PerformanceChart() {
  return (
    <section className="panel chart-panel">
      <div className="panel-heading">
        <div>
          <h2>Ticket theo ngày</h2>
          <p>Số lượng ticket được tạo trong 7 ngày qua</p>
        </div>
        <span className="chart-period-label">7 ngày</span>
      </div>
      <div className="chart-legend">
        <span>
          <i className="legend-dot opened-dot" />
          Ticket mới
        </span>
      </div>
      <div className="dashboard-bar-chart">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={ticketsByDay}
            margin={{ top: 5, right: 5, left: -20, bottom: 0 }}
          >
            <CartesianGrid
              vertical={false}
              stroke="#edf0ed"
              strokeDasharray="3 4"
            />
            <XAxis
              dataKey="day"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#929c95", fontSize: 9 }}
            />
            <YAxis
              allowDecimals={false}
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#929c95", fontSize: 8 }}
            />
            <Tooltip
              cursor={{ fill: "#f1f6f2" }}
              contentStyle={{
                border: "1px solid #e5ebe5",
                borderRadius: 6,
                fontSize: 10,
              }}
              formatter={(value) => [`${value} ticket`, "Số lượng"]}
            />
            <Bar
              dataKey="tickets"
              fill="#32805d"
              maxBarSize={34}
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}

export function MessageSourceChart() {
  return (
    <section className="panel source-panel">
      <div className="panel-heading">
        <div>
          <h2>Nguồn tin nhắn</h2>
          <p>Tỷ lệ theo kênh tiếp nhận</p>
        </div>
      </div>
      <div className="source-chart-layout">
        <div className="source-pie-wrap">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={messageSources}
                dataKey="value"
                nameKey="name"
                innerRadius="62%"
                outerRadius="88%"
                paddingAngle={3}
                stroke="none"
              >
                {messageSources.map((source) => (
                  <Cell key={source.name} fill={source.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  border: "1px solid #e5ebe5",
                  borderRadius: 6,
                  fontSize: 10,
                }}
                formatter={(value) => [`${value}%`, "Tỷ lệ"]}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="source-pie-center">
            <strong>100%</strong>
            <span>Tổng số</span>
          </div>
        </div>
        <div className="source-legend">
          {messageSources.map((source) => (
            <div className="source-legend-row" key={source.name}>
              <span className="source-legend-name">
                <i style={{ backgroundColor: source.color }} />
                {source.name}
              </span>
              <strong>{source.value}%</strong>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
