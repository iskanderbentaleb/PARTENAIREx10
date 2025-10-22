<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>PARTENAIREx10 — README</title>
  <style>
    :root{
      --bg:#0f1720; --card:#0b1220; --text:#e6eef8; --muted:#9fb0c8;
      --accent:#60a5fa; --code:#0b1220; --pre:#071025;
    }
    @media (prefers-color-scheme: light) {
      :root{
        --bg:#f6f8fb; --card:#fff; --text:#0b1220; --muted:#4b5563;
        --accent:#2563eb; --code:#f3f4f6; --pre:#eef2ff;
      }
    }
    body{font-family:Inter,ui-sans-serif,system-ui,-apple-system,"Segoe UI",Roboto,"Helvetica Neue",Arial;
      margin:0;background:var(--bg);color:var(--text);line-height:1.5;padding:32px;}
    .container{max-width:980px;margin:0 auto}
    header{display:flex;align-items:center;gap:16px;margin-bottom:20px}
    .logo{width:64px;height:64px;border-radius:8px;background:linear-gradient(135deg,var(--accent),#7c3aed);display:flex;align-items:center;justify-content:center;font-weight:700;font-size:20px;color:white;box-shadow:0 6px 20px rgba(2,6,23,0.5)}
    h1{margin:0;font-size:28px}
    h2{margin-top:28px;margin-bottom:10px;color:var(--accent)}
    p.lead{color:var(--muted);margin-top:8px}
    .card{background:var(--card);border-radius:12px;padding:20px;margin-top:12px;box-shadow:0 8px 30px rgba(2,6,23,0.45)}
    ul{margin:0 0 16px 20px}
    code, pre{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:13px}
    pre{background:var(--pre);padding:12px;border-radius:8px;overflow:auto;color:var(--text)}
    .grid{display:grid;grid-template-columns:1fr;gap:12px}
    .meta{font-size:13px;color:var(--muted);margin-top:6px}
    a{color:var(--accent);text-decoration:none}
    footer{margin-top:28px;color:var(--muted);font-size:13px}
    .short{background:linear-gradient(90deg, rgba(96,165,250,0.12), rgba(124,58,237,0.06));padding:12px;border-radius:8px;color:var(--text);border:1px solid rgba(255,255,255,0.02)}
    .badge{display:inline-block;background:rgba(255,255,255,0.03);padding:6px 10px;border-radius:999px;font-size:13px;color:var(--muted);margin-right:8px}
    @media (max-width:640px){body{padding:20px}h1{font-size:22px}}
  </style>
</head>
<body>
  <div class="container">
    <header>
      <div class="logo">PX10</div>
      <div>
        <h1>PARTENAIREx10</h1>
        <p class="lead">Investment &amp; Supplier Management System — Laravel 12 + Inertia.js + React.js</p>
        <div class="meta">Small-business focused system to manage suppliers, investors, purchases, debts and cash flow.</div>
      </div>
    </header>

    <section class="card">
      <h2>💼 PARTENAIREx10: Investment &amp; Supplier Management System</h2>
      <p>
        <strong>PARTENAIREx10</strong> is a modern web application built with <strong>Laravel 12</strong>, <strong>Inertia.js</strong>, and <strong>React.js</strong>.
        It helps small businesses manage relationships with <strong>suppliers</strong> and <strong>investors</strong>, tracking purchases, unpaid invoices, capital, cash available,
        and money in process (products not sold yet) — all in a clean, focused interface for fast growth.
      </p>

      <h2>🚀 Features</h2>
      <ul>
        <li><strong>Supplier Management:</strong> Track suppliers, unpaid invoices, and purchase quantities.</li>
        <li><strong>Investor Tracking:</strong> Monitor capital investments, expected returns, and payouts.</li>
        <li><strong>Purchase &amp; Inventory Tracking:</strong> Record purchases (factures) and mark which items are sold or pending.</li>
        <li><strong>Debt &amp; Payment Monitoring:</strong> Manage debts to suppliers and money owed to investors.</li>
        <li><strong>Capital Overview:</strong> View available cash, active investments, and value tied in unsold products.</li>
        <li><strong>Smart Reconciliation:</strong> Mark products as sold to automatically update supplier/investor balances.</li>
        <li><strong>Reports &amp; Analytics:</strong> Dashboards for growth and financial clarity.</li>
        <li><strong>Multi-User Roles:</strong> Admin, supplier, and investor roles with separated access.</li>
        <li><strong>Dark/Light Mode</strong> and responsive UI for all devices.</li>
      </ul>

      <h2>🛠️ Tech Stack</h2>
      <div class="grid">
        <div>
          <strong>Backend:</strong>
          <ul>
            <li>Laravel 12</li>
            <li>MySQL</li>
          </ul>
        </div>
        <div>
          <strong>Frontend:</strong>
          <ul>
            <li>React.js (TypeScript) with Inertia.js</li>
            <li>Tailwind CSS</li>
            <li>Shadcn UI</li>
          </ul>
        </div>
        <div>
          <strong>Additional:</strong>
          <ul>
            <li>Laravel 12 Starter Kit (extended for suppliers &amp; investors)</li>
          </ul>
        </div>
      </div>

      <h2>⚡ Installation</h2>
      <h3>Prerequisites</h3>
      <ul>
        <li>PHP 8.2+</li>
        <li>MySQL 5.7+</li>
        <li>Node.js 18+</li>
        <li>Composer 2.0+</li>
        <li>XAMPP/WAMP/LAMP or equivalent</li>
      </ul>

      <h3>Setup Instructions</h3>
      <ol>
        <li>
          <strong>Clone the repository</strong>
          <pre><code>git clone https://github.com/iskanderbentaleb/PARTENAIREx10.git
cd PARTENAIREx10</code></pre>
        </li>
        <li>
          <strong>Install dependencies</strong>
          <pre><code>composer install
npm install</code></pre>
        </li>
        <li>
          <strong>Configure environment</strong>
          <pre><code>cp .env.example .env</code></pre>
          <div class="meta">Update <code>.env</code> with your DB and mail settings. Example:</div>
          <pre><code>DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=partnerx10
DB_USERNAME=root
DB_PASSWORD=</code></pre>
        </li>
        <li>
          <strong>Generate application key</strong>
          <pre><code>php artisan key:generate</code></pre>
        </li>
        <li>
          <strong>Database setup</strong>
          <p class="meta">Edit <code>database/seeders/UserSeeder.php</code> for admin credentials, then run migrations and seeders:</p>
          <pre><code>php artisan migrate --seed</code></pre>
        </li>
        <li>
          <strong>Start the development server</strong>
          <pre><code>composer run dev</code></pre>
        </li>
        <li>
          <strong>Access the application</strong>
          <p class="meta">Admin Panel: <a href="http://localhost:8000/admin/login" target="_blank" rel="noopener">http://localhost:8000/admin/login</a></p>
        </li>
      </ol>

      <h2>💡 Example Use Case</h2>
      <p>
        Suppose a supplier sends an unpaid invoice for <strong>10 products = 10,000 DZD</strong> (1,000 DZD each).
        You record the purchase in PARTENAIREx10. After some days, you perform inventory reconciliation and mark which products were sold.
        The system automatically updates the supplier balance so you know exactly what you owe.
      </p>
      <p>
        For investors: an investor may fund stock (e.g., 10,000 DZD) expecting a return (e.g., 12,000 DZD).
        PARTENAIREx10 tracks capital invested, products purchased with that capital, sales that generate returns, and payouts to the investor.
        The dashboard shows <strong>total capital invested</strong>, <strong>cash available</strong>, <strong>products sold / unsold</strong>, and <strong>money in process</strong>.
      </p>

      <h2>📄 License</h2>
      <p>This project is open-source and free to use.</p>

      <h2>📬 Contact</h2>
      <p>For inquiries or support, please contact:<br>
        <a href="mailto:iskanderboss1999@gmail.com">iskanderboss1999@gmail.com</a>
      </p>

      <h2>🔹 Short Description (GitHub summary)</h2>
      <div class="short">
        <strong>PARTENAIREx10</strong> is a Laravel + React system that helps small businesses manage suppliers, investors, debts, and purchases — tracking capital, sales, and payments in real time.
      </div>
    </section>

    <footer>
      <div class="badge">Repository: PARTENAIREx10</div>
      <div style="margin-top:10px">
        Made with ❤️ · Built with Laravel 12, Inertia.js and React.js
      </div>
    </footer>
  </div>
</body>
</html>
