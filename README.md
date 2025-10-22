💼 PARTENAIREx10: Investment & Supplier Management System
<div align="center">
https://img.shields.io/badge/Laravel-12-FF2D20?style=for-the-badge&logo=laravel
https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react
https://img.shields.io/badge/TypeScript-5.0-3178C6?style=for-the-badge&logo=typescript
https://img.shields.io/badge/MySQL-8.0-4479A1?style=for-the-badge&logo=mysql
https://img.shields.io/badge/Tailwind-3.0-06B6D4?style=for-the-badge&logo=tailwindcss

Modern web application for managing suppliers, investors, and business finances

Features • Installation • Tech Stack • Demo • Support

</div>
🌟 Overview
PARTENAIREx10 is a comprehensive business management system built with Laravel 12, Inertia.js, and React.js, designed specifically for small businesses and entrepreneurs to efficiently manage relationships with suppliers and investors.

🚀 Smart Business Scaling Made Simple - Track financial interactions, monitor cash flow, manage capital, and maintain transparent partner relationships without unnecessary complexity.

https://via.placeholder.com/800x400/2F5597/FFFFFF?text=PARTENAIREx10+Dashboard+-+Modern+Business+Management

🚀 Features
💰 Financial Management
Supplier Tracking - Monitor invoices, purchases, and outstanding debts

Investor Dashboard - Track capital investments, profits, and returns

Cash Flow Monitoring - Real-time view of available cash and active investments

Debt Reconciliation - Automated balance updates as products are sold

📊 Business Intelligence
Purchase & Inventory Tracking - Record factures and track sold/pending items

Capital Overview - Instant visibility into cash, investments, and product value

Smart Reporting - Interactive dashboards with performance analytics

Multi-Currency Support - Native DZD handling with extensible currency system

👥 Role-Based Access
Admin Panel - Complete system control and oversight

Supplier Portal - Dedicated interface for supplier interactions

Investor Access - Transparent view of investments and returns

Multi-User Management - Secure role-based permissions

🎨 User Experience
Dark/Light Mode - Modern theme switching

Responsive Design - Optimized for all devices

Real-time Updates - Live financial data synchronization

Excel Export - Comprehensive reporting capabilities

🛠️ Tech Stack
Backend
Technology	Version	Purpose
Laravel	12.x	PHP Framework
MySQL	8.0+	Database
Inertia.js	1.0	Server-side routing
Laravel Excel	4.0	Export functionality
Frontend
Technology	Version	Purpose
React.js	18.x	UI Framework
TypeScript	5.x	Type Safety
Tailwind CSS	3.x	Styling
Shadcn UI	Latest	Component Library
Inertia.js	1.0	Client-side routing
⚡ Quick Installation
Prerequisites
PHP 8.2+

MySQL 5.7+

Node.js 18+

Composer 2.0+

🚀 Setup in 5 Minutes
bash
# 1. Clone repository
git clone https://github.com/iskanderbentaleb/PARTENAIREx10.git
cd PARTENAIREx10

# 2. Install dependencies
composer install
npm install

# 3. Configure environment
cp .env.example .env
⚙️ Environment Configuration
Edit your .env file:

env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=partnerx10
DB_USERNAME=root
DB_PASSWORD=

# Optional: Mail configuration for notifications
MAIL_MAILER=smtp
MAIL_HOST=127.0.0.1
MAIL_PORT=2525
🗄️ Database Setup
bash
# Generate application key
php artisan key:generate

# Update admin credentials in database/seeders/UserSeeder.php
# then run migrations and seeders:

php artisan migrate --seed
🎯 Start Development
bash
# Start the development server
composer run dev

# Access the application
# Admin Panel: http://localhost:8000/admin/login
💡 Real-World Example
📋 Business Scenario
Imagine you receive an unpaid invoice from a supplier for 10 products worth 10,000 DZD (1,000 DZD each). An investor contributes 10,000 DZD expecting 12,000 DZD in return.

🔄 How PARTENAIREx10 Helps
graph TD
    A[Supplier Invoice] --> B[Record Purchase]
    B --> C[Track 10 Products]
    C --> D[Mark Products as Sold]
    D --> E[Auto-Update Supplier Balance]
    
    F[Investor Contribution] --> G[Track Capital]
    G --> H[Monitor Sales Progress]
    H --> I[Calculate Returns]
    I --> J[Generate Investor Reports]
📊 System Outputs
Total Capital: 10,000 DZD

Available Cash: Real-time tracking

Products in Process: Unsold inventory value

Supplier Debt: Automated as products sell

Investor Returns: Transparent profit sharing

📁 Project Structure
text
PARTENAIREx10/
├── app/
│   ├── Models/
│   │   ├── Supplier.php
│   │   ├── Investor.php
│   │   ├── Purchase.php
│   │   └── Transaction.php
│   ├── Exports/
│   │   ├── SupplierReportExport.php
│   │   └── InvestorReportExport.php
│   └── Http/Controllers/
├── database/
│   ├── migrations/
│   └── seeders/
├── resources/
│   └── js/
│       ├── Pages/
│       │   ├── Suppliers/
│       │   └── Investors/
│       └── Components/
└── public/
🎨 Screenshots
(Add your actual screenshots here)

Dashboard	Supplier Management	Investor Reports
https://via.placeholder.com/300x200/2F5597/FFFFFF?text=Dashboard	https://via.placeholder.com/300x200/2D7D32/FFFFFF?text=Suppliers	https://via.placeholder.com/300x200/7B1FA2/FFFFFF?text=Investors
🔄 API Endpoints
Method	Endpoint	Description
GET	/api/suppliers	List all suppliers
POST	/api/suppliers	Create new supplier
GET	/api/investors	List all investors
GET	/api/suppliers/{id}/export	Export supplier report
GET	/api/investors/{id}/export	Export investor report
🤝 Contributing
We welcome contributions! Please feel free to submit pull requests or open issues for bugs and feature requests.

Fork the project

Create your feature branch (git checkout -b feature/AmazingFeature)

Commit your changes (git commit -m 'Add some AmazingFeature')

Push to the branch (git push origin feature/AmazingFeature)

Open a Pull Request

📄 License
This project is open-source and available under the MIT License.

📬 Support & Contact
<div align="center">
💬 Need Help?
📧 Email: iskanderboss1999@gmail.com
🐛 Issues: GitHub Issues
⭐ Star us on GitHub!

PARTENAIREx10 - Smart Business Management for Growing Enterprises

</div>
🔗 Quick Links
📚 Documentation (Coming Soon)

🐛 Report Bug

💡 Request Feature

👥 Contributors

<div align="center">
Built with ❤️ using Laravel 12 & React.js

Making business management accessible for everyone

</div>
