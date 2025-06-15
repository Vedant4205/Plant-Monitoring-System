# Plant Monitoring System - Detailed Report

## 1. Detailed System Architecture

### 1.1 System Overview
The Plant Monitoring System is a full-stack web application that integrates IoT sensors with a modern web interface. The system follows a client-server architecture with the following components:

#### Frontend Layer
- Web-based dashboard built with TypeScript
- Real-time data visualization using interactive charts
- Responsive UI design for multiple device compatibility

#### Backend Layer
- Node.js server with TypeScript
- RESTful API endpoints for data management
- Google Sheets integration for data persistence

#### IoT Layer
- Sensor network for environmental monitoring
- Real-time data collection and transmission
- Support for multiple plant monitoring stations

### 1.2 Data Flow
1. Sensors collect environmental data (temperature, humidity, soil moisture)
2. Data is transmitted to the backend server
3. Server processes and stores data in Google Sheets
4. Frontend fetches and visualizes data in real-time
5. Alert system monitors thresholds and notifies users

## 2. Technical Specifications

### 2.1 Hardware Requirements
- IoT sensors for:
  - Temperature monitoring
  - Humidity measurement
  - Soil moisture detection
- Microcontroller/Arduino for sensor interface
- Network connectivity module

### 2.2 Software Requirements
- Node.js runtime environment
- TypeScript compiler
- Web browser with JavaScript support
- Google Sheets API access
- npm package manager

### 2.3 Development Tools
- TypeScript for type-safe development
- Webpack for module bundling
- Git for version control
- VS Code recommended for development

## 3. Implementation Details

### 3.1 Project Structure
```
plant-monitoring-system
├── src
│   ├── server
│   │   ├── app.ts          # Server entry point
│   │   ├── routes/         # API route handlers
│   │   └── services/       # Business logic
│   ├── client
│   │   ├── index.html      # Main UI
│   │   ├── styles.css      # Styling
│   │   └── script.ts       # Frontend logic
│   └── types
│       └── index.ts        # TypeScript definitions
```

### 3.2 Key Features Implementation
- Real-time data monitoring
- Dynamic chart generation
- Alert threshold management
- Google Sheets integration
- Multi-plant support
- Responsive UI design

## 4. API Documentation

### 4.1 Endpoints

#### GET /api/plants
- Returns list of all monitored plants
- Response: Array of plant objects with sensor data

#### GET /api/plants/:id
- Returns specific plant data
- Parameters: plant ID
- Response: Plant object with current sensor readings

#### POST /api/plants/:id/alerts
- Sets alert thresholds for a plant
- Parameters: plant ID, threshold values
- Response: Updated alert configuration

### 4.2 Data Models

#### Plant Object
```typescript
interface Plant {
  id: string;
  name: string;
  temperature: number;
  humidity: number;
  soilMoisture: number;
  lastUpdated: Date;
}
```

## 5. Setup and Configuration Guide

### 5.1 Prerequisites
1. Node.js installation
2. npm package manager
3. Google Sheets API credentials
4. Git

### 5.2 Installation Steps
1. Clone repository:
   ```bash
   git clone <repository-url>
   cd plant-monitoring-system
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure Google Sheets:
   - Set up API credentials
   - Update configuration in `config/sheets.ts`

4. Start the server:
   ```bash
   npm start
   ```

5. Access the application at `http://localhost:3000`

## 6. User Manual

### 6.1 Dashboard Overview
- Main dashboard displays real-time sensor data
- Plant selection dropdown for multiple plants
- Interactive charts for data visualization
- Alert status indicators

### 6.2 Key Features
1. **Plant Monitoring**
   - View current environmental conditions
   - Track historical data trends
   - Monitor multiple plants simultaneously

2. **Alert Management**
   - Set custom thresholds for each plant
   - Receive notifications for critical conditions
   - View alert history

3. **Data Analysis**
   - View derived metrics (VPD, Dew Point, Heat Index)
   - Export data to Google Sheets
   - Generate reports

## 7. Testing Procedures

### 7.1 Unit Testing
- Test individual components
- Verify data processing functions
- Validate API endpoints

### 7.2 Integration Testing
- Test sensor data flow
- Verify Google Sheets integration
- Validate real-time updates

### 7.3 System Testing
- End-to-end testing of all features
- Performance testing
- Security testing

## 8. Future Enhancements

### 8.1 Planned Features
1. Mobile application development
2. Machine learning for predictive analysis
3. Automated plant care recommendations
4. Enhanced data visualization
5. Multi-language support
6. Advanced alert system with SMS/Email notifications

### 8.2 Scalability Improvements
- Support for more sensor types
- Enhanced data storage solutions
- Improved real-time processing
- Better error handling and recovery

## 9. Conclusion

The Plant Monitoring System provides a comprehensive solution for automated plant care through real-time monitoring and intelligent alerts. The system's modular architecture allows for easy expansion and customization, making it suitable for various applications from home gardening to agricultural research.

The integration of IoT sensors with modern web technologies creates a powerful platform for plant health management. Future enhancements will further improve the system's capabilities and user experience.

---

**Project Team:**
- Patel Vedant Prakash, BTech Electrical Engineering, Class of 2027
- Patwari Jevesh Devang, BTech Electrical Engineering, Class of 2027

**Supervisor:**
- Prof. Sudip Roy, Computer Science and Engineering

**Institution:**
- Indian Institute of Technology, Roorkee 