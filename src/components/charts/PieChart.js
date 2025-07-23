import React, { forwardRef } from 'react';
import { Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

const PieChart = forwardRef(({ chartData, chartOptions }, ref) => {
  return <Pie ref={ref} data={chartData} options={chartOptions} />;
});

export default PieChart;
