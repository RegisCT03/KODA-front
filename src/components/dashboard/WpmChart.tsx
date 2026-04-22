'use client';
import { motion } from 'framer-motion';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  type TooltipContentProps,
} from 'recharts';

type ValueType = number | string | ReadonlyArray<number | string>;
type NameType  = number | string;

interface WpmChartProps {
  data?: any[];
}

function CustomTooltip({ active, payload, label }: TooltipContentProps<ValueType, NameType>) {
  if (!active || !payload || payload.length === 0) return null;

  return (
    <div
      className="rounded border p-3 font-mono text-xs"
      style={{
        backgroundColor: '#0a0a0a',
        borderColor: 'rgba(0,255,255,0.3)',
        boxShadow: '0 0 12px rgba(0,255,255,0.1)',
      }}
    >
      <p className="mb-2" style={{ color: '#444444' }}>{label}</p>
      {payload[0] && (
        <p style={{ color: '#00ffff' }}>
          WPM: <span className="font-bold">{payload[0].value}</span>
        </p>
      )}
      {payload[1] && (
        <p style={{ color: '#00ff00' }}>
          Precision: <span className="font-bold">{payload[1].value}%</span>
        </p>
      )}
    </div>
  );
}

export function WpmChart({ data = [] }: WpmChartProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      className="flex flex-col gap-4"
    >
      <p className="font-mono uppercase tracking-widest text-[0.75rem] text-zinc-500">
        WPM History — Last Sessions
      </p>

     {data.length === 0 ? (
        <div className="flex h-[280px] w-full items-center justify-center border border-dashed border-zinc-800 rounded">
          <span className="text-zinc-600 text-sm font-mono">No hay suficientes datos para la gráfica</span>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={280}>
          <LineChart
            data={data}
            margin={{ top: 8, right: 8, left: -20, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#111111" vertical={false} />
            <XAxis
              dataKey="date"
              tick={{ fill: '#333333', fontFamily: 'monospace', fontSize: 11 }}
              axisLine={{ stroke: '#1a1a1a' }}
              tickLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              tick={{ fill: '#333333', fontFamily: 'monospace', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              domain={['auto', 'auto']}
            />
            <Tooltip content={(props) => <CustomTooltip {...props} />} />
            <Line
              type="monotone"
              dataKey="wpm"
              stroke="#00ffff"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: '#00ffff', stroke: '#000000', strokeWidth: 2 }}
            />
            <Line
              type="monotone"
              dataKey="precision"
              stroke="#00ff00"
              strokeWidth={1.5}
              strokeDasharray="4 2"
              dot={false}
              activeDot={{ r: 3, fill: '#00ff00', stroke: '#000000', strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      )}

      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          <span className="inline-block h-0.5 w-4 rounded bg-cyan-400" aria-hidden="true" />
          <span className="font-mono text-[11px] text-zinc-500">WPM</span>
        </div>
        <div className="flex items-center gap-2">
          <span
            className="inline-block"
            style={{ width: 16, height: 1.5, backgroundImage: 'repeating-linear-gradient(to right, #00ff00 0, #00ff00 4px, transparent 4px, transparent 6px)' }}
            aria-hidden="true"
          />
          <span className="font-mono text-[11px] text-zinc-500">Precision</span>
        </div>
      </div>
    </motion.div>
  );
}