interface SensorData {
    timestamp: string;
    ahtTemp: number;
    ahtHumidity: number;
    dhtTemp: number;
    dhtHumidity: number;
    soilMoisture: number;
    vpd?: number;
    dewPoint?: number;
    heatIndex?: number;
}

let tempChart: Chart | null = null;
let humiChart: Chart | null = null;
let soilChart: Chart | null = null;
let vpdChart: Chart | null = null;
let loadingMessage: HTMLElement | null = null;
let lastError: HTMLElement | null = null;
let selectedPlant: string = 'plant1';

function parseDate(dateString: string): Date {
    const [datePart, timePart] = dateString.split(' ');
    const [month, day, year] = datePart.split('/');
    const [hours, minutes, seconds] = timePart.split(':');

    return new Date(
        parseInt(year),
        parseInt(month) - 1,
        parseInt(day),
        parseInt(hours),
        parseInt(minutes),
        parseInt(seconds)
    );
}

function formatDate(dateString: string): string {
    const date = parseDate(dateString);
    if (isNaN(date.getTime())) {
        console.error('Invalid date:', dateString);
        return dateString;
    }

    return date.toLocaleString('en-IN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
    });
}

// VPD calculation helper (in kPa)
function calculateVPD(tempC: number, humidity: number): number {
    // Formula: VPD = SVP * (1 - RH/100)
    // SVP (Saturated Vapor Pressure) in kPa
    // SVP = 0.6108 * exp((17.27 * T) / (T + 237.3))
    const svp = 0.6108 * Math.exp((17.27 * tempC) / (tempC + 237.3));
    return +(svp * (1 - humidity / 100)).toFixed(2);
}

// Dew Point calculation (°C)
function calculateDewPoint(tempC: number, humidity: number): number {
    // Magnus formula
    const a = 17.27, b = 237.7;
    const alpha = ((a * tempC) / (b + tempC)) + Math.log(humidity / 100);
    return +(b * alpha / (a - alpha)).toFixed(2);
}

// Heat Index calculation (°C, simplified for typical indoor range)
function calculateHeatIndex(tempC: number, humidity: number): number {
    // Rothfusz regression (approximate, valid for T > 26.7°C)
    const t = tempC, rh = humidity;
    const hi = -8.784695 + 1.61139411 * t + 2.338549 * rh - 0.14611605 * t * rh
        - 0.012308094 * t * t - 0.016424828 * rh * rh + 0.002211732 * t * t * rh
        + 0.00072546 * t * rh * rh - 0.000003582 * t * t * rh * rh;
    return +(hi > t ? hi : t).toFixed(2); // Only show if higher than actual temp
}

// Plant selection event
const plantSelect = document.getElementById('plant-select') as HTMLSelectElement;

// Dynamically populate plant dropdown from backend
async function populatePlantDropdown() {
    if (!plantSelect) return;
    try {
        const res = await fetch('http://localhost:3000/api/plants');
        if (!res.ok) throw new Error('Failed to fetch plant list');
        const plants = await res.json();
        plantSelect.innerHTML = '';
        plants.forEach((plant: { id: string, name: string }) => {
            const opt = document.createElement('option');
            opt.value = plant.id;
            opt.text = plant.name;
            plantSelect.appendChild(opt);
        });
        selectedPlant = plantSelect.value;
    } catch (e) {
        // fallback to static options if needed
        plantSelect.innerHTML = `
            <option value="plant1">Plant 1</option>
            <option value="plant2">Plant 2</option>
            <option value="plant3">Plant 3</option>
            <option value="plant4">Plant 4</option>
        `;
        selectedPlant = plantSelect.value;
    }
}

if (plantSelect) {
    plantSelect.addEventListener('change', (e) => {
        selectedPlant = plantSelect.value;
        fetchData();
    });
}

// On page load, populate dropdown
populatePlantDropdown();

function getPlantThresholds(plantId: string) {
    switch (plantId) {
        case 'plant1':
            return { minTemp: 15, maxTemp: 37, minHumi: 40, maxHumi: 90, minSoil: 20, maxSoil: 90 };
        case 'plant2':
            return { minTemp: 18, maxTemp: 40, minHumi: 35, maxHumi: 85, minSoil: 25, maxSoil: 85 };
        case 'plant3':
            return { minTemp: 20, maxTemp: 45, minHumi: 30, maxHumi: 80, minSoil: 30, maxSoil: 80 };
        case 'plant4':
            return { minTemp: 12, maxTemp: 35, minHumi: 45, maxHumi: 95, minSoil: 15, maxSoil: 95 };
        default:
            return { minTemp: 15, maxTemp: 37, minHumi: 40, maxHumi: 90, minSoil: 20, maxSoil: 90 };
    }
}

function showAlerts(latest: SensorData) {
    const alertArea = document.getElementById('alert-area');
    if (!alertArea) return;
    let alerts: string[] = [];

    // Get thresholds for selected plant
    const thresholds = getPlantThresholds(selectedPlant);
    const temp = (latest.ahtTemp + latest.dhtTemp) / 2;
    const humi = (latest.ahtHumidity + latest.dhtHumidity) / 2;
    const soil = latest.soilMoisture;

    // Temperature alert
    if (temp < thresholds.minTemp || temp > thresholds.maxTemp) {
        alerts.push(`<div class='alert alert-critical'>
            <svg viewBox='0 0 24 24' fill='none'><circle cx='12' cy='12' r='10' stroke='#c62828' stroke-width='2'/><path d='M12 7v5' stroke='#c62828' stroke-width='2' stroke-linecap='round'/><circle cx='12' cy='16' r='1.2' fill='#c62828'/></svg>
            <span>Critical Temperature: <b>${temp.toFixed(1)}°C</b> (Safe: ${thresholds.minTemp}–${thresholds.maxTemp}°C)</span>
        </div>`);
    }
    // Humidity alert
    if (humi < thresholds.minHumi || humi > thresholds.maxHumi) {
        alerts.push(`<div class='alert alert-critical'>
            <svg viewBox='0 0 24 24' fill='none'><circle cx='12' cy='12' r='10' stroke='#c62828' stroke-width='2'/><path d='M12 7v5' stroke='#c62828' stroke-width='2' stroke-linecap='round'/><circle cx='12' cy='16' r='1.2' fill='#c62828'/></svg>
            <span>Critical Humidity: <b>${humi.toFixed(1)}%</b> (Safe: ${thresholds.minHumi}–${thresholds.maxHumi}%)</span>
        </div>`);
    }
    // Soil moisture alert
    if (soil < thresholds.minSoil || soil > thresholds.maxSoil) {
        alerts.push(`<div class='alert alert-critical'>
            <svg viewBox='0 0 24 24' fill='none'><circle cx='12' cy='12' r='10' stroke='#c62828' stroke-width='2'/><path d='M12 7v5' stroke='#c62828' stroke-width='2' stroke-linecap='round'/><circle cx='12' cy='16' r='1.2' fill='#c62828'/></svg>
            <span>Critical Soil Moisture: <b>${soil}%</b> (Safe: ${thresholds.minSoil}–${thresholds.maxSoil}%)</span>
        </div>`);
    }
    // Extreme temperature notification
    if (temp > thresholds.maxTemp + 5) {
        alerts.push(`<div class='alert alert-warning'>
            <svg viewBox='0 0 24 24' fill='none'><circle cx='12' cy='12' r='10' stroke='#ef6c00' stroke-width='2'/><path d='M12 7v5' stroke='#ef6c00' stroke-width='2' stroke-linecap='round'/><circle cx='12' cy='16' r='1.2' fill='#ef6c00'/></svg>
            <span><b>Notification:</b> Temperature is more than 5°C above safe range for this plant!</span>
        </div>`);
    }

    alertArea.innerHTML = alerts.join('');
}

async function fetchData() {
    try {
        showLoading(true);
        const response = await fetch('http://localhost:3000/api/data');
        if (!response.ok) throw new Error('Network response was not ok');
        const rawData = await response.json();

        if (!Array.isArray(rawData) || rawData.length === 0) {
            showLoading(false);
            showError('No data received from server.');
            return;
        }

        // For now, all plants show the same data. In future, filter by plant.
        const formattedData: SensorData[] = rawData.map((row: any[]) => {
            const ahtTemp = Number(row[1]);
            const ahtHumidity = Number(row[2]);
            const dhtTemp = Number(row[3]);
            const dhtHumidity = Number(row[4]);
            const avgTemp = (ahtTemp + dhtTemp) / 2;
            const avgHumidity = (ahtHumidity + dhtHumidity) / 2;
            // Convert raw soil moisture to percentage (0 = wet, 1023 = dry)
            const rawSoil = Number(row[5]);
            const min = 0, max = 1023;
            const soilMoisturePercent = Math.round(100 * (1 - (rawSoil - min) / (max - min)));
            return {
                timestamp: formatDate(row[0]),
                ahtTemp,
                ahtHumidity,
                dhtTemp,
                dhtHumidity,
                soilMoisture: soilMoisturePercent,
                vpd: calculateVPD(avgTemp, avgHumidity),
                dewPoint: calculateDewPoint(avgTemp, avgHumidity),
                heatIndex: calculateHeatIndex(avgTemp, avgHumidity)
            };
        });

        showLoading(false);
        showError('');
        updateSummaryCard(formattedData);
        updateWebpage(formattedData);
        updateCharts(formattedData);
        showAlerts(formattedData[formattedData.length - 1]);
    } catch (error) {
        showLoading(false);
        showError('Error fetching data: ' + (error as Error).message);
        console.error('Error fetching data:', error);
    }
}

function updateSummaryCard(data: SensorData[]) {
    const latest = data[data.length - 1];
    let card = document.getElementById('summary-card');
    if (!card) {
        card = document.createElement('div');
        card.id = 'summary-card';
        card.style.background = '#e8f5e9';
        card.style.borderRadius = '14px';
        card.style.boxShadow = '0 1px 8px rgba(76,175,80,0.10)';
        card.style.padding = '18px 16px 10px 16px';
        card.style.margin = '18px 0 24px 0';
        card.style.display = 'flex';
        card.style.flexWrap = 'wrap';
        card.style.justifyContent = 'space-around';
        card.style.gap = '18px';
        const app = document.getElementById('sensor-data');
        if (app) app.insertBefore(card, app.firstChild);
    }
    if (latest) {
        card.innerHTML = `
            <div><b>Latest for <span style='color:#388e3c'>${plantSelect?.options[plantSelect.selectedIndex].text}</span>:</b></div>
            <div><b>Temp:</b> ${((latest.ahtTemp + latest.dhtTemp) / 2).toFixed(1)}°C</div>
            <div><b>Humidity:</b> ${((latest.ahtHumidity + latest.dhtHumidity) / 2).toFixed(1)}%</div>
            <div><b>Soil Moisture:</b> ${latest.soilMoisture}%</div>
            <div><b>VPD:</b> ${latest.vpd} kPa</div>
            <div><b>Dew Point:</b> ${latest.dewPoint}°C</div>
            <div><b>Heat Index:</b> ${latest.heatIndex}°C</div>
        `;
    }
}

function updateWebpage(data: SensorData[]) {
    const dataList = document.getElementById('data-list');
    if (!dataList) return;

    dataList.innerHTML = data.map(reading => `
        <tr>
            <td class="timestamp-cell">${reading.timestamp}</td>
            <td class="numeric-cell">${reading.ahtTemp}</td>
            <td class="numeric-cell">${reading.ahtHumidity}</td>
            <td class="numeric-cell">${reading.dhtTemp}</td>
            <td class="numeric-cell">${reading.dhtHumidity}</td>
            <td class="numeric-cell">${reading.soilMoisture}</td>
            <td class="numeric-cell" title="Vapor Pressure Deficit (kPa)">${reading.vpd ?? ''}</td>
            <td class="numeric-cell" title="Dew Point (°C)">${reading.dewPoint ?? ''}</td>
            <td class="numeric-cell" title="Heat Index (°C)">${reading.heatIndex ?? ''}</td>
        </tr>
    `).join('');
}

function updateCharts(data: SensorData[]) {
    const timestamps = data.map(d => d.timestamp);
    const avgTemps = data.map(d => (d.ahtTemp + d.dhtTemp) / 2);
    const avgHumi = data.map(d => (d.ahtHumidity + d.dhtHumidity) / 2);
    const soilMoist = data.map(d => d.soilMoisture);
    const vpdVals = data.map(d => d.vpd ?? null);

    const tempCtx = document.getElementById('tempChart') as HTMLCanvasElement;
    const humiCtx = document.getElementById('humiChart') as HTMLCanvasElement;
    const soilCtx = document.getElementById('soilChart') as HTMLCanvasElement;
    let vpdCtx = document.getElementById('vpdChart') as HTMLCanvasElement;

    // Temperature Chart
    if (!tempChart) {
        tempChart = new Chart(tempCtx, {
            type: 'line',
            data: {
                labels: timestamps,
                datasets: [{
                    label: 'Avg Temp (°C)',
                    data: avgTemps,
                    borderColor: 'rgba(255, 99, 132, 1)',
                    backgroundColor: 'rgba(255, 99, 132, 0.2)',
                    fill: true,
                    lineTension: 0.4
                }]
            },
            options: {
                responsive: true,
                animation: { duration: 0 },
                scales: {
                    xAxes: [{
                        ticks: {
                            autoSkip: true,
                            maxTicksLimit: 10
                        }
                    }]
                }
            }
        });
    } else {
        if (tempChart.data.datasets && tempChart.data.datasets.length > 0) {
            tempChart.data.labels = timestamps;
            tempChart.data.datasets[0].data = avgTemps;
            tempChart.update();
        }
    }

    // Humidity Chart
    if (!humiChart) {
        humiChart = new Chart(humiCtx, {
            type: 'line',
            data: {
                labels: timestamps,
                datasets: [{
                    label: 'Avg Humidity (%)',
                    data: avgHumi,
                    borderColor: 'rgba(54, 162, 235, 1)',
                    backgroundColor: 'rgba(54, 162, 235, 0.2)',
                    fill: true,
                    lineTension: 0.4
                }]
            },
            options: {
                responsive: true,
                animation: { duration: 0 },
                scales: {
                    xAxes: [{
                        ticks: {
                            autoSkip: true,
                            maxTicksLimit: 10
                        }
                    }]
                }
            }
        });
    } else {
        if (humiChart.data.datasets && humiChart.data.datasets.length > 0) {
            humiChart.data.labels = timestamps;
            humiChart.data.datasets[0].data = avgHumi;
            humiChart.update();
        }
    }

    // Soil Moisture Chart
    if (!soilChart) {
        soilChart = new Chart(soilCtx, {
            type: 'line',
            data: {
                labels: timestamps,
                datasets: [{
                    label: 'Soil Moisture (%)',
                    data: soilMoist,
                    borderColor: 'rgba(75, 192, 192, 1)',
                    backgroundColor: 'rgba(75, 192, 192, 0.2)',
                    fill: true,
                    lineTension: 0.4
                }]
            },
            options: {
                responsive: true,
                animation: { duration: 0 },
                scales: {
                    xAxes: [{
                        ticks: {
                            autoSkip: true,
                            maxTicksLimit: 10
                        }
                    }]
                }
            }
        });
    } else {
        if (soilChart.data.datasets && soilChart.data.datasets.length > 0) {
            soilChart.data.labels = timestamps;
            soilChart.data.datasets[0].data = soilMoist;
            soilChart.update();
        }
    }

    // VPD Chart
    vpdCtx = document.getElementById('vpdChart') as HTMLCanvasElement;
    if (vpdCtx) {
        if (!vpdChart) {
            vpdChart = new Chart(vpdCtx, {
                type: 'line',
                data: {
                    labels: timestamps,
                    datasets: [{
                        label: 'Vapor Pressure Deficit (kPa)',
                        data: vpdVals,
                        borderColor: 'rgba(255, 206, 86, 1)',
                        backgroundColor: 'rgba(255, 206, 86, 0.2)',
                        fill: true,
                        lineTension: 0.4
                    }]
                },
                options: {
                    responsive: true,
                    animation: { duration: 0 },
                    scales: {
                        xAxes: [{
                            ticks: {
                                autoSkip: true,
                                maxTicksLimit: 10
                            }
                        }]
                    }
                }
            });
        } else {
            if (vpdChart.data.datasets && vpdChart.data.datasets.length > 0) {
                vpdChart.data.labels = timestamps;
                vpdChart.data.datasets[0].data = vpdVals;
                vpdChart.update();
            }
        }
    }
}

function showLoading(show: boolean) {
    if (!loadingMessage) {
        loadingMessage = document.getElementById('loading-message');
    }
    if (loadingMessage) {
        loadingMessage.style.display = show ? 'block' : 'none';
    }
}

function showError(msg: string) {
    if (!lastError) {
        lastError = document.getElementById('error-message');
        if (!lastError) {
            lastError = document.createElement('div');
            lastError.id = 'error-message';
            lastError.style.color = 'red';
            lastError.style.textAlign = 'center';
            lastError.style.margin = '10px 0';
            loadingMessage?.parentNode?.insertBefore(lastError, loadingMessage.nextSibling);
        }
    }
    if (lastError) {
        lastError.textContent = msg;
        lastError.style.display = msg ? 'block' : 'none';
    }
}

// Initial fetch
fetchData();

// Refresh every second
setInterval(fetchData, 1000);
