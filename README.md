# Construction Site Blocker Management System

A modern React-based web application designed to streamline construction site blocker management and communication between contractors, subcontractors, and site managers.

**✅ Latest Update:** Fixed Vercel deployment compilation errors - ready for production deployment!

## 🏗️ Overview

This application helps construction teams efficiently track, manage, and resolve blockers that impede project progress. It provides a centralized platform for reporting issues, assigning responsibility, and monitoring resolution status across multiple contractors and trades.

## ✨ Key Features

### 📱 Mobile-First Design
- **Touch-optimized interface** for field workers
- **Responsive design** that works on phones, tablets, and desktops
- **Gesture controls** for panning and zooming site drawings

### 🎯 Blocker Management
- **Real-time ticket system** with unique tracking numbers
- **Priority levels** (Low, Medium, High, Critical)
- **Status tracking** (Open, Assigned, Resolved)
- **Photo documentation** with camera integration
- **Location mapping** on site drawings

### 📋 Interactive Site Plans
- **Upload and view** construction drawings
- **Pin-point accuracy** for marking blocker locations
- **Multi-floor support** (Ground Floor, 1st Floor, 2nd Floor, Basement, Roof)
- **Zoom and pan** functionality for detailed inspection

### 👥 Multi-Contractor Workflow
- **User authentication** by company and role
- **Assignment system** for routing blockers to appropriate trades
- **Notification system** (Telegram integration ready)
- **Status history** tracking for full audit trail

### 📊 Dashboard & Analytics
- **Real-time statistics** showing open, assigned, and resolved blockers
- **Filtering and search** capabilities
- **Personal tracking** for submitted blockers
- **Due date management** and escalation

## 🚀 Getting Started

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn package manager

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/construction-blockers-app.git
   cd construction-blockers-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm start
   ```

4. **Open your browser**
   Navigate to `http://localhost:3000` to view the application

### Available Scripts

- `npm start` - Runs the app in development mode
- `npm build` - Builds the app for production
- `npm test` - Launches the test runner
- `npm eject` - Ejects from Create React App (one-way operation)

## 🛠️ Technology Stack

- **Frontend Framework**: React 18.x
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Build Tool**: Create React App
- **State Management**: React Hooks (useState, useRef)
- **Touch/Gesture Support**: Native browser APIs

## 📱 Usage Guide

### For Field Workers

1. **Creating a Blocker**
   - Navigate to "Create Blocker" tab
   - Select the appropriate floor/area
   - Use touch gestures to zoom and pan the drawing
   - Activate "Pin Mode" and tap the exact location
   - Fill in title, description, and priority
   - Optionally attach a photo
   - Submit to notify the main contractor

2. **Tracking Progress**
   - Use "Track My Blockers" to monitor submitted issues
   - View real-time status updates
   - Check assignment information and due dates

### For Site Managers

1. **Dashboard Overview**
   - Monitor all active blockers across trades
   - Filter by status (Open, Assigned, Resolved)
   - Search by keywords or descriptions
   - View priority indicators and due dates

2. **Assignment & Resolution**
   - Assign open blockers to appropriate contractors
   - Monitor progress through status history
   - Mark blockers as resolved when completed

## 🏢 Contractor Types Supported

- **Electrical** - ABC Electrical Ltd
- **Plumbing** - PlumbPro Services
- **General Construction** - BuildRight Construction
- **Structural** - SteelWorks Ltd
- **Flooring** - FloorMasters

## 📐 Site Areas Supported

- Ground Floor
- 1st Floor
- 2nd Floor
- Basement
- Roof Plan

## 🔧 Configuration

### Mock Data
The application currently uses mock data for demonstration purposes. In a production environment, you would:

1. Replace mock data with API calls to your backend
2. Implement proper authentication
3. Configure Telegram bot integration
4. Set up file upload for site drawings
5. Add database persistence

### Customization
- Modify contractor list in `src/App.js`
- Update site drawings in the `siteDrawings` array
- Customize user roles and permissions
- Adjust notification settings

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support, feature requests, or bug reports, please create an issue in the GitHub repository.

## 🔮 Future Enhancements

- [ ] Backend API integration
- [ ] Real-time notifications via WebSocket
- [ ] Offline mode with sync capability
- [ ] Advanced reporting and analytics
- [ ] Integration with project management tools
- [ ] QR code generation for quick blocker access
- [ ] Voice note attachments
- [ ] GPS location tracking
- [ ] Document management system
- [ ] Calendar integration for scheduling

---

**Built for the construction industry by developers who understand the challenges of coordinating complex projects across multiple trades and contractors.**