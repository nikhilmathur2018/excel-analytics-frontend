import React, { forwardRef } from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const BarChart = forwardRef(({ chartData, chartOptions }, ref) => {
  return <Bar ref={ref} data={chartData} options={chartOptions} />;
});

export default BarChart;
