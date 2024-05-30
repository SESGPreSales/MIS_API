// Sample data
const pvBrightnessData = [
    { dateTime: '2023-05-01T00:00:00Z', pvBrightness: 50 },
    { dateTime: '2023-05-01T01:00:00Z', pvBrightness: 55 },
    { dateTime: '2023-05-01T02:00:00Z', pvBrightness: 60 },
    // Add more data points as needed
];

// Extract the data for the chart
const labels = pvBrightnessData.map(data => new Date(data.dateTime).toLocaleString());
const dataPoints = pvBrightnessData.map(data => data.pvBrightness);

// Set up the chart
const ctx = document.getElementById('pvBrightnessChart').getContext('2d');
const pvBrightnessChart = new Chart(ctx, {
    type: 'line',
    data: {
        labels: labels,
        datasets: [{
            label: 'pvBrightness',
            data: dataPoints,
            borderColor: 'rgba(75, 192, 192, 1)',
            backgroundColor: 'rgba(75, 192, 192, 0.2)',
            fill: false,
            tension: 0.1
        }]
    },
    options: {
        scales: {
            x: {
                type: 'time',
                time: {
                    unit: 'hour'
                },
                title: {
                    display: true,
                    text: 'Time'
                }
            },
            y: {
                title: {
                    display: true,
                    text: 'Brightness'
                }
            }
        }
    }
});

// Function to update the chart with new data
function updateChart(newData) {
    pvBrightnessData.push(newData);
    pvBrightnessChart.data.labels.push(new Date(newData.dateTime).toLocaleString());
    pvBrightnessChart.data.datasets[0].data.push(newData.pvBrightness);
    pvBrightnessChart.update();
}

// Example of updating the chart with new data point
setTimeout(() => {
    const newData = { dateTime: '2023-05-01T03:00:00Z', pvBrightness: 65 };
    updateChart(newData);
}, 5000);
