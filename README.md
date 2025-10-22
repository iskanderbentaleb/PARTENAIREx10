# 💼 PARTENAIREx10: Investment & Supplier Management System

A modern web application built with Laravel 12, Inertia.js, and React.js, designed to help small businesses efficiently manage relationships with suppliers and investors. This system allows you to track all financial interactions, including purchases, debts, cash flow, capital, and ongoing transactions, giving you a complete overview of your business's financial health in real time.

Unlike traditional ERP systems, PARTENAIREx10 is designed specifically for small businesses and entrepreneurs who want to scale smartly — managing supplier credits, investor funds, and sales progress without unnecessary complexity.

---

## 🚀 Features

- **Supplier Management:** Track suppliers, unpaid invoices, and purchase quantities
- **Investor Tracking:** Monitor capital investments, profits, and investor returns
- **Purchase & Inventory Tracking:** Record each purchase (facture) and track what's sold or pending
- **Debt & Payment Monitoring:** Manage debts to suppliers and money owed to investors
- **Capital Overview:** Instantly view available cash, active investments, and product value still in process
- **Smart Reconciliation:** Mark products as sold to automatically update supplier and investor balances
- **Reports & Analytics:** Visualize performance and growth through interactive dashboards
- **Multi-User Roles:** Manage admin, supplier, and investor access separately
- **Dark/Light Mode:** Switch between modern light and dark themes
- **Responsive Design:** Fully optimized for desktop, tablet, and mobile devices

---

## 🛠️ Tech Stack

**Backend:**
- Laravel 12
- MySQL

**Frontend:**
- React.js (TypeScript) with Inertia.js
- Tailwind CSS
- Shadcn UI

**Additional:**
- Laravel 12 Starter Kit

---

## ⚡ Installation

### Prerequisites

- PHP 8.2+
- MySQL 5.7+
- Node.js 18+
- Composer 2.0+
- XAMPP/WAMP/LAMP (or equivalent)

### Setup Instructions

1. **Clone the repository**
    ```bash
    git clone https://github.com/iskanderbentaleb/PARTENAIREx10.git
    cd PARTENAIREx10
    ```

2. **Install dependencies**
    ```bash
    composer install
    npm install
    ```

3. **Configure environment**
    ```bash
    cp .env.example .env
    ```
    > **Note:** Update your `.env` file with your database credentials and mail settings.

    Example configuration:

    ```bash
    DB_CONNECTION=mysql
    DB_HOST=127.0.0.1
    DB_PORT=3306
    DB_DATABASE=partnerx10
    DB_USERNAME=root
    DB_PASSWORD=
    ```

4. **Generate application key**
    ```bash
    php artisan key:generate
    ```

5. **Database setup**
    - Edit `database/seeders/UserSeeder.php` with your admin credentials
    - Run migrations and seeders:
      
      ```bash
      php artisan migrate --seed
      ```

6. **Start the development server**
    ```bash
    composer run dev
    ```

7. **Access the application**
    - **Admin Panel:** [http://localhost:8000/admin/login](http://localhost:8000/admin/login)

---

## 💡 Example Use Case

Imagine you receive an unpaid invoice from a supplier for 10 products worth 10,000 DZD (1,000 DZD each).
Over time, as you sell products, you mark them as sold in the system — automatically updating what you owe your supplier.

Similarly, if an investor contributes 10,000 DZD for stock, they might expect 12,000 DZD in return once products are sold. PARTENAIREx10 tracks this investment cycle, showing:

- Total Capital Invested
- Cash Available
- Products Sold / Unsold
- Money in Process

This helps you clearly understand your business position and maintain transparent relations with your partners.

---

## 📄 License

This project is open-source and free to use.

---

## 📬 Contact

For inquiries or support, please contact:  
📧 iskanderboss1999@gmail.com

---

**PARTENAIREx10** - *Smart Business Management for Growing Enterprises*

![Dashboard](./screenshots/dashboard.png)
![Suppliers](./screenshots/suppliers.png)
![Investors](./screenshots/investors.png)
![Reports](./screenshots/reports.png)
![Dark Mode](./screenshots/dark-mode.png)
![Mobile View](./screenshots/mobile.png)
![Excel Export](./screenshots/excel-export.png)
![Financial Summary](./screenshots/financial-summary.png)
![Transaction History](./screenshots/transactions.png)
![Supplier Details](./screenshots/supplier-details.png)
