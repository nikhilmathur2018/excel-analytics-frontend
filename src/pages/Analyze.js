import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react'; // Import useCallback
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useSelector } from 'react-redux';
import jsPDF from 'jspdf';

// Import Chart.js components
import BarChart from '../components/charts/BarChart';
import LineChart from '../components/charts/LineChart';
import PieChart from '../components/charts/PieChart';
import Column3DChart from '../components/charts/Column3DChart';

// Import and Register chartjs-plugin-datalabels
import ChartDataLabels from 'chartjs-plugin-datalabels';
import { Chart as ChartJS, registerables } from 'chart.js';
ChartJS.register(...registerables, ChartDataLabels);

function Analyze() {
  const { fileId } = useParams();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);

  const [fileData, setFileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [selectedSheet, setSelectedSheet] = useState('');
  const [xAxis, setXAxis] = useState('');
  const [yAxis, setYAxis] = useState('');
  const [chartType, setChartType] = useState('Bar');

  const [chartConfig, setChartConfig] = useState(null);

  const [column3DData, setColumn3DData] = useState([]);

  const chartRef = useRef(null);

  const [aiSummary, setAiSummary] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  const [showSheetConfirmModal, setShowSheetConfirmModal] = useState(false);
  const [sheetToDelete, setSheetToDelete] = useState(null);

  // --- Define Color Palettes using useMemo to prevent unnecessary re-renders ---
  const barColors = useMemo(() => [
    'rgba(75, 192, 192, 0.7)', 'rgba(153, 102, 255, 0.7)', 'rgba(255, 159, 64, 0.7)',
    'rgba(255, 99, 132, 0.7)', 'rgba(54, 162, 235, 0.7)', 'rgba(255, 206, 86, 0.7)',
    'rgba(75, 192, 192, 0.7)', 'rgba(199, 199, 199, 0.7)', 'rgba(83, 102, 255, 0.7)',
    'rgba(10, 200, 100, 0.7)',
  ], []);

  const lineColors = useMemo(() => ({
    backgroundColor: 'rgba(54, 162, 235, 0.2)',
    borderColor: 'rgba(54, 162, 235, 1)',
    pointBackgroundColor: 'rgba(54, 162, 235, 1)',
    pointBorderColor: '#fff',
    pointHoverBackgroundColor: '#fff',
    pointHoverBorderColor: 'rgba(54, 162, 235, 1)',
  }), []);

  const pieColors = useMemo(() => [
    'rgba(255, 99, 132, 0.8)', 'rgba(54, 162, 235, 0.8)', 'rgba(255, 206, 86, 0.8)',
    'rgba(75, 192, 192, 0.8)', 'rgba(153, 102, 255, 0.8)', 'rgba(255, 159, 64, 0.8)',
    'rgba(201, 203, 207, 0.8)', 'rgba(100, 150, 200, 0.8)', 'rgba(200, 100, 150, 0.8)',
    'rgba(150, 200, 100, 0.8)',
  ], []);
  // --- End Color Palettes ---


  // Function to fetch file data (re-usable for initial load and after sheet deletion)
  // FIX: Wrap fetchFileData in useCallback to make it stable
  const fetchFileData = useCallback(async () => {
    try {
      if (!user || !user.token) {
        setError('User not authenticated. Please log in.');
        setLoading(false);
        return;
      }

      const config = {
        headers: { Authorization: `Bearer ${user.token}` },
      };
      // FIX: Added process.env.REACT_APP_API_URL
      const result = await axios.get(`${process.env.REACT_APP_API_URL}/api/upload/${fileId}/data`, config);
      setFileData(result.data);

      // Auto-select the first sheet if the previously selected sheet was deleted
      // or if no sheet was selected initially.
      if (result.data.sheetNames && result.data.sheetNames.length > 0) {
        if (!selectedSheet || !result.data.sheetNames.includes(selectedSheet)) {
            setSelectedSheet(result.data.sheetNames[0]);
            setXAxis(''); // Reset axes when sheet selection changes
            setYAxis('');
        }
      } else {
          // If no sheets are left in the file, redirect to the history page
          console.log("No sheets left in this file. Redirecting to history.");
          navigate('/history'); // Redirect to dashboard or history page
          return; // Stop further execution
      }
      setLoading(false);
    } catch (err) {
      console.error("Error fetching file data:", err.response ? err.response.data : err.message);
      setError('Failed to load file data. Please ensure the file exists and you are authorized.');
      setLoading(false);
    }
  }, [user, fileId, navigate, selectedSheet, setFileData, setSelectedSheet, setXAxis, setYAxis, setError, setLoading]); // Added all dependencies for useCallback


  // useEffect for initial file data fetching when component mounts or fileId/user changes
  useEffect(() => {
    if (user && fileId) {
      fetchFileData();
    } else if (!fileId) {
        setLoading(false);
        setError("No file selected for analysis. Please go to your dashboard and select a file.");
    }
  }, [user, fileId, fetchFileData]); // FIX: Added fetchFileData to dependencies


  // useEffect for chart configuration based on selected sheet, axes, and chart type
  useEffect(() => {
    if (fileData && selectedSheet && xAxis && yAxis) {
      const currentSheetData = fileData.parsedData[selectedSheet];
      if (!currentSheetData || currentSheetData.length === 0) {
        setChartConfig(null);
        setColumn3DData([]);
        return;
      }

      console.log("----------------- Debugging Chart Data -----------------");
      console.log("Selected Sheet Data:", currentSheetData);
      console.log("X-Axis Header Selected:", xAxis);
      console.log("Y-Axis Header Selected:", yAxis);

      const tempLabels = [];
      const tempValues = [];

      currentSheetData.forEach(row => {
        const rawX = row[xAxis];
        const rawY = row[yAxis];

        let parsedY = parseFloat(String(rawY).replace(/,/g, '').replace(/\$/g, '').trim());

        if (!isNaN(parsedY) && parsedY !== null) {
          tempLabels.push(rawX);
          tempValues.push(parsedY);
        } else {
          console.warn(`Skipping data point: X-axis "${rawX}", Y-axis raw "${rawY}" resulted in NaN.`);
        }
      });

      const filteredLabels = tempLabels;
      const filteredDataValues = tempValues;

      console.log("X-Axis Labels (filtered):", filteredLabels);
      console.log("Y-Axis Data Values (parsed & filtered):", filteredDataValues);
      if (filteredDataValues.length > 0) {
        console.log("Min Y-Value:", Math.min(...filteredDataValues));
        console.log("Max Y-Value:", Math.max(...filteredDataValues));
      } else {
        console.log("No valid numerical data for Y-Axis after filtering.");
      }
      console.log("Number of Data Points:", filteredDataValues.length);
      console.log("---------------------------------------------------------");

      if (filteredDataValues.length === 0) {
        setChartConfig(null);
        setColumn3DData([]);
        return;
      }

      let datasetConfig = {};

      switch (chartType) {
        case 'Bar':
          datasetConfig = {
            label: yAxis,
            data: filteredDataValues,
            backgroundColor: barColors,
            borderColor: barColors.map(color => color.replace('0.7', '1')),
            borderWidth: 1,
          };
          break;
        case 'Line':
          datasetConfig = {
            label: yAxis,
            data: filteredDataValues,
            fill: false,
            tension: 0.4,
            backgroundColor: lineColors.backgroundColor,
            borderColor: lineColors.borderColor,
            pointBackgroundColor: lineColors.pointBackgroundColor,
            pointBorderColor: lineColors.pointBorderColor,
            pointHoverBackgroundColor: lineColors.pointHoverBackgroundColor,
            pointHoverBorderColor: lineColors.pointHoverBorderColor,
            borderWidth: 2,
          };
          break;
        case 'Pie':
          datasetConfig = {
            label: yAxis,
            data: filteredDataValues,
            backgroundColor: pieColors,
            borderColor: '#fff',
            borderWidth: 2,
          };
          break;
        default:
          datasetConfig = {
            label: yAxis,
            data: filteredDataValues,
            backgroundColor: 'rgba(75, 192, 192, 0.6)',
            borderColor: 'rgba(75, 192, 192, 1)',
            borderWidth: 1,
          };
          break;
      }

      const config = {
        labels: filteredLabels,
        datasets: [datasetConfig],
      };
      setChartConfig(config);

      const newColumn3DData = filteredLabels.map((label, index) => ({
        label: label,
        value: filteredDataValues[index]
      }));
      setColumn3DData(newColumn3DData);

    } else {
      setChartConfig(null);
      setColumn3DData([]);
    }
  }, [fileData, selectedSheet, xAxis, yAxis, chartType, barColors, lineColors, pieColors]);


  const handleDownloadPng = () => {
    if (chartRef.current) {
      const url = chartRef.current.toBase64Image();
      const link = document.createElement('a');
      link.href = url;
      link.download = `${chartType}-chart.png`;
      link.click();
    } else {
        console.warn("Chart reference not available for PNG download.");
    }
  };

  const handleDownloadPdf = () => {
    if (chartRef.current) {
      const imgData = chartRef.current.toBase64Image('image/png', 1.0);
      const doc = new jsPDF();
      const imgProps = doc.getImageProperties(imgData);
      const pdfWidth = doc.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      doc.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      doc.save(`${chartType}-chart.pdf`);
    } else {
        console.warn("Chart reference not available for PDF download.");
    }
  };


  const handleGetAiSummary = async () => {
    setAiLoading(true);
    setAiSummary('');

    try {
      if (!user || !user.token) {
        setAiSummary('Please log in to get AI insights.');
        setAiLoading(false);
        return;
      }

      const config = {
        headers: { Authorization: `Bearer ${user.token}` },
      };

      const dataForAI = fileData?.parsedData?.[selectedSheet];
      const currentXAxis = xAxis;
      const currentYAxis = yAxis;
      const currentChartType = chartType;

      if (!dataForAI || !currentXAxis || !currentYAxis || !currentChartType) {
        setAiSummary('Please select a file, sheet, X-axis, Y-axis, and Chart Type before getting AI insights.');
        setAiLoading(false);
        return;
      }

      // FIX: Added process.env.REACT_APP_API_URL
      const aiResponse = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/ai/summary`,
        {
          dataToSummarize: dataForAI.slice(0, 100),
          xAxis: currentXAxis,
          yAxis: currentYAxis,
          chartType: currentChartType
        },
        config
      );

      setAiSummary(aiResponse.data.summary);
      setAiLoading(false);

    } catch (error) {
      console.error('Error fetching AI summary:', error);
      if (error.response && error.response.status === 429) {
        setAiSummary('AI quota exceeded. Please check your OpenAI billing details on platform.openai.com.');
      } else if (error.response && error.response.data && error.response.data.message) {
        setAiSummary(`Failed to get AI summary: ${error.response.data.message}`);
      } else {
        setAiSummary('Failed to get AI summary. Please try again.');
      }
      setAiLoading(false);
    }
  };

  // NEW: Handle Delete Sheet Click (shows confirmation modal)
  const handleDeleteSheetClick = (sheetName) => {
    // Prevent deleting if it's the last sheet
    if (fileData.sheetNames.length <= 1) {
        setError("Cannot delete the last sheet in the file. Please delete the entire file from history instead.");
        return;
    }
    setSheetToDelete(sheetName);
    setShowSheetConfirmModal(true);
  };

  // NEW: Confirm Sheet Deletion (sends request to backend)
  const confirmSheetDelete = async () => {
    setShowSheetConfirmModal(false); // Hide the modal
    if (!sheetToDelete || !fileId) return; // Should not happen if modal is shown correctly

    try {
        if (!user || !user.token) {
            setError('Authentication required to delete sheet.');
            return;
        }

        const config = {
            headers: { Authorization: `Bearer ${user.token}` },
        };

        // Send PUT request to backend to delete the sheet
        // FIX: Added process.env.REACT_APP_API_URL
        await axios.put(`${process.env.REACT_APP_API_URL}/api/upload/${fileId}/sheet/${sheetToDelete}`, {}, config);

        // If successful, re-fetch file data to update the UI
        // This will also automatically handle redirection if the last sheet was deleted (handled in fetchFileData)
        await fetchFileData(); // Use await to ensure data is refetched before proceeding
        setSheetToDelete(null); // Clear state
        setError(null); // Clear any previous errors
        console.log(`Sheet "${sheetToDelete}" deleted successfully.`);
    } catch (err) {
        console.error("Error deleting sheet:", err.response ? err.response.data : err.message);
        setError(`Failed to delete sheet: ${err.response?.data?.message || err.message}`);
    }
  };

  // NEW: Cancel Sheet Deletion
  const cancelSheetDelete = () => {
    setShowSheetConfirmModal(false);
    setSheetToDelete(null);
  };


  // Memoized chart options
  const getChartOptions = useMemo(() => (currentChartType) => {
    const baseOptions = {
      responsive: true,
      maintainAspectRatio: false,
      animation: {
          duration: 750,
          easing: 'easeOutQuart',
      },
      plugins: {
        legend: {
          position: 'top',
        },
        title: {
          display: true,
          text: `${yAxis || 'Y-Axis'} by ${xAxis || 'X-Axis'}`,
        },
        datalabels: {
            display: false,
        },
      },
      scales: {
        y: {
          display: currentChartType !== 'Pie',
          beginAtZero: true,
          ticks: {
          }
        },
        x: {
          display: currentChartType !== 'Pie',
          ticks: {
            autoSkip: true,
            maxRotation: 45,
            minRotation: 0,
          }
        }
      }
    };

    if (currentChartType === 'Pie') {
        baseOptions.plugins.datalabels = {
            color: '#fff',
            formatter: (value, ctx) => {
                const total = ctx.chart.data.datasets[0].data.reduce((sum, current) => sum + current, 0);
                if (total === 0) return '0%';
                const percentage = (value / total * 100).toFixed(1) + '%';
                return percentage;
            },
            font: {
                weight: 'bold',
                size: 14,
            },
            textShadowBlur: 2,
            textShadowColor: 'rgba(0,0,0,0.6)',
        };
        delete baseOptions.scales;
    }

    return baseOptions;
  }, [xAxis, yAxis]);


  // Conditional Renderings for initial loading/error states
  if (loading) return <div className="text-center py-8 text-xl text-gray-700">Loading data...</div>;
  if (error) return <div className="text-center py-8 text-xl text-red-600 font-semibold">{error}</div>;
  // If fileData is null after loading, means no data found or file was deleted
  if (!fileData) return <div className="text-center py-8 text-xl text-gray-600">No data found for this file or file was deleted.</div>;


  const currentColumnHeaders = fileData.columnHeaders[selectedSheet] || [];

  return (
    <div className="p-8 bg-gray-100 min-h-screen">
      <h1 className="text-3xl font-extrabold mb-6 text-gray-900 border-b pb-3">Analyze: {fileData.originalFileName}</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 bg-white p-6 rounded-lg shadow-md">
        {/* Select Sheet */}
        <div className="flex flex-col">
            <label className="block text-sm font-medium text-gray-700 mb-1">Select Sheet:</label>
            <div className="flex items-center space-x-2">
                <select
                    value={selectedSheet}
                    onChange={(e) => setSelectedSheet(e.target.value)}
                    className="flex-grow mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md shadow-sm"
                >
                    {/* Only render options if sheetNames exist */}
                    {fileData.sheetNames && fileData.sheetNames.map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                    ))}
                </select>
                {/* Only show delete button if there's at least one sheet and a sheet is selected */}
                {fileData.sheetNames && fileData.sheetNames.length > 0 && selectedSheet && (
                    <button
                        onClick={() => handleDeleteSheetClick(selectedSheet)}
                        className="p-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition duration-200 text-sm font-medium"
                        title={`Delete sheet "${selectedSheet}"`}
                    >
                        Delete Sheet
                    </button>
                )}
            </div>
        </div>

        {/* X-Axis Selector */}
        <div className="flex flex-col">
            <label className="block text-sm font-medium text-gray-700 mb-1">X-Axis:</label>
            <select
                value={xAxis}
                onChange={(e) => setXAxis(e.target.value)}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md shadow-sm"
            >
                <option value="">Select a column</option>
                {currentColumnHeaders.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                ))}
            </select>
        </div>

        {/* Y-Axis Selector */}
        <div className="flex flex-col">
            <label className="block text-sm font-medium text-gray-700 mb-1">Y-Axis:</label>
            <select
                value={yAxis}
                onChange={(e) => setYAxis(e.target.value)}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md shadow-sm"
            >
                <option value="">Select a column</option>
                {currentColumnHeaders.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                ))}
            </select>
        </div>

        {/* Chart Type Selector */}
        <div className="flex flex-col">
            <label className="block text-sm font-medium text-gray-700 mb-1">Chart Type:</label>
            <select
                value={chartType}
                onChange={(e) => setChartType(e.target.value)}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md shadow-sm"
            >
                {['Bar', 'Line', 'Pie', '3DColumn'].map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                ))}
            </select>
        </div>
      </div>

      {/* Chart Display */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        {(chartConfig && ['Bar', 'Line', 'Pie'].includes(chartType)) || (chartType === '3DColumn' && column3DData.length > 0) ? (
          <div className="mt-4" style={{ height: '500px', width: '100%' }}>
            {chartType === 'Bar' && (
              <BarChart ref={chartRef} chartData={chartConfig} chartOptions={getChartOptions('Bar')} />
            )}
            {chartType === 'Line' && (
              <LineChart ref={chartRef} chartData={chartConfig} chartOptions={getChartOptions('Line')} />
            )}
            {chartType === 'Pie' && (
              <PieChart ref={chartRef} chartData={chartConfig} chartOptions={getChartOptions('Pie')} />
            )}
            {chartType === '3DColumn' && (
              <Column3DChart
                data={column3DData}
                xAxisLabel={xAxis}
                yAxisLabel={yAxis}
              />
            )}

            {['Bar', 'Line', 'Pie'].includes(chartType) && (
              <div className="mt-6 flex justify-center space-x-4">
                <button onClick={handleDownloadPng} className="px-6 py-3 bg-blue-600 text-white rounded-lg shadow-md hover:bg-blue-700 transition duration-300 font-semibold text-lg">Download PNG</button>
                <button onClick={handleDownloadPdf} className="px-6 py-3 bg-red-600 text-white rounded-lg shadow-md hover:bg-red-700 transition duration-300 font-semibold text-lg">Download PDF</button>
              </div>
            )}
          </div>
        ) : (
          <p className="mt-4 text-gray-600 text-center py-10">Select axes and chart type to generate a chart or No valid data for chart.</p>
        )}
      </div>

      {/* AI Summary Button and Display Area */}
      <div className="mt-8 bg-white p-6 rounded-lg shadow-md">
        <button
            onClick={handleGetAiSummary}
            disabled={aiLoading || !fileData || !selectedSheet || !xAxis || !yAxis || !chartType}
            className="w-full px-6 py-3 bg-purple-600 text-white rounded-lg shadow-md hover:bg-purple-700 disabled:opacity-50 transition duration-300 ease-in-out font-semibold text-lg"
        >
            {aiLoading ? 'Generating AI Summary...' : 'Get AI Insights'}
        </button>

        {aiSummary && (
            <div className="mt-6 p-6 bg-blue-50 border border-blue-200 rounded-lg shadow-inner text-gray-800">
                <h3 className="text-xl font-bold mb-4 text-blue-800">AI Insights:</h3>
                <p className="leading-relaxed whitespace-pre-wrap">{aiSummary}</p>
            </div>
        )}
      </div>

      {/* NEW: Sheet Confirmation Modal */}
      {showSheetConfirmModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-sm w-full text-center">
            <h3 className="text-lg font-bold mb-4">Confirm Sheet Deletion</h3>
            <p className="mb-6">Are you sure you want to delete the sheet "{sheetToDelete}"?</p>
            <div className="flex justify-center space-x-4">
              <button
                onClick={confirmSheetDelete}
                className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition duration-200"
              >
                Yes, Delete Sheet
              </button>
              <button
                onClick={cancelSheetDelete}
                className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 transition duration-200"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Analyze;