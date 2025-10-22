<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Investor Report - {{ $investor->name }}</title>
  <style>
    @page {
      size: A4 landscape;
      margin: 0.8cm;
    }

    body {
      font-family: 'Segoe UI', Tahoma, sans-serif;
      font-size: 11px;
      color: #000;
      margin: 0;
      padding: 0;
      line-height: 1.3;
      background: #fff;
    }

    .container {
      padding: 8px;
    }

    .document-title {
      text-align: center;
      font-size: 16px;
      font-weight: bold;
      margin: 15px 0;
      border-bottom: 1px solid #333;
      padding-bottom: 8px;
    }

    .investor-info {
      margin-bottom: 15px;
      padding: 10px;
      background: #ffffff;
      border: 0.1px solid #0000005c;
    }

    .info-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 8px;
    }

    .info-item {
      display: flex;
      justify-content: space-between;
      padding: 4px 0;
    }

    .info-label {
      font-weight: bold;
      color: #000000;
    }

    /* ===== Summary Table ===== */
    .summary-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 15px;
      border: 0.1px solid #0000005c;
      overflow: hidden;
    }

    .summary-table tr:nth-child(even) {
      background: #f0f0f037;
      border: 0.1px solid #0000005c;
    }

    .summary-table td {
      padding: 8px 12px;
      border: none;
    }

    .summary-label {
      font-weight: 600;
      color: #000000;
      width: 40%;
    }

    .summary-value {
      font-weight: 700;
      text-align: right;
      width: 60%;
    }

    .positive {
      color: black;
      font-weight: bold 400;
    }

    .negative {
      color: #dc3545;
    }

    /* ===== Sections and Tables ===== */
    .section-header {
      font-weight: bold;
      font-size: 13px;
      margin: 15px 0 8px;
      padding: 5px 8px;
      background-color: #f0f0f022;
      border: 0.1px solid #0000005c;
    }

    .data-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 8px;
      font-size: 9px;
    }

    .data-table th, .data-table td {
      border: 1px solid #d0d0d0;
      padding: 4px 6px;
      text-align: left;
    }

    .data-table th {
      background-color: #404040;
      color: white;
      font-weight: bold;
    }

    .data-table tr:nth-child(even) {
      background-color: #fafafa;
    }

    .text-right {
      text-align: right;
    }

    .text-center {
      text-align: center;
    }

    .type-in {
      background-color: #ffffff;
    }

    .type-out {
      background-color: #d8d7d765;
    }

    .notes-cell {
      max-width: 120px;
      word-wrap: break-word;
    }

    .timestamp-cell {
      font-size: 8px;
      white-space: nowrap;
    }

    .footer {
      margin-top: 20px;
      text-align: center;
      font-size: 10px;
      color: #888;
      border-top: 1px solid #e0e0e0;
      padding-top: 8px;
    }

    .grand-total-row {
      background-color: #e8e8e81c !important;
      font-weight: bold;
    }

    .grand-total-row td {
      border-top: 1px solid #333;
    }

    @media print {
      .section-header, .data-table th {
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
    }
  </style>
</head>
<body>
  <div class="container">

    <div class="document-title">Investor Report - {{ $investor->name }}</div>

    <div class="investor-info">
      <div class="info-grid">
        <div class="info-item">
          <span class="info-label">Name:</span>
          <span>{{ $investor->name }}</span>
        </div>
        <div class="info-item">
          <span class="info-label">Phone:</span>
          <span>{{ $investor->phone ?? 'N/A' }}</span>
        </div>
        <div class="info-item">
          <span class="info-label">Email:</span>
          <span>{{ $investor->email ?? 'N/A' }}</span>
        </div>
        <div class="info-item">
          <span class="info-label">Address:</span>
          <span>{{ $investor->address ?? 'N/A' }}</span>
        </div>
      </div>
      @if($investor->notes)
      <div class="info-item" style="margin-top: 8px;">
        <span class="info-label">Notes:</span>
        <span>{{ $investor->notes }}</span>
      </div>
      @endif
    </div>

    <!-- Summary Table - Only 4 Main Metrics -->
    <table class="summary-table">
      <tr>
        <td class="summary-label">Total Capital:</td>
        <td class="summary-value">{{ number_format($financialSummary['totalCapital'], 0, ',', ' ') }} DZD</td>
      </tr>
      <tr>
        <td class="summary-label">Available Cash:</td>
        <td class="summary-value {{ $financialSummary['availableCash'] >= 0 ? 'positive' : 'negative' }}">
          {{ number_format($financialSummary['availableCash'], 0, ',', ' ') }} DZD
        </td>
      </tr>
      <tr>
        <td class="summary-label">In Process:</td>
        <td class="summary-value">{{ number_format($financialSummary['cashInProcess'], 0, ',', ' ') }} DZD</td>
      </tr>
      <tr>
        <td class="summary-label">Profit/Loss:</td>
        <td class="summary-value {{ $financialSummary['profit'] >= 0 ? 'positive' : 'negative' }}">
          {{ number_format($financialSummary['profit'], 0, ',', ' ') }} DZD
        </td>
      </tr>
    </table>

    <!-- Transactions Table -->
    @if($transactions->count() > 0)
    <div class="section-header">Transaction History ({{ $transactions->count() }})</div>
    <table class="data-table">
      <thead>
        <tr>
          <th>Date</th>
          <th>Type</th>
          <th>Amount</th>
          <th>Notes</th>
          <th>Created At</th>
          <th>Updated At</th>
        </tr>
      </thead>
      <tbody>
        @foreach($transactions as $transaction)
        <tr class="type-{{ strtolower($transaction->type) }}">
          <td class="text-center">
            {{ \Carbon\Carbon::parse($transaction->date)->format('d/m/Y') }}
          </td>
          <td class="text-center">
            @if($transaction->type == 'In')
              <strong class="positive">DEPOSIT -IN-</strong>
            @else
              <strong class="negative">WITHDRAWAL -OUT-</strong>
            @endif
          </td>
          <td class="text-right">
            @if($transaction->type == 'In')
              <strong class="positive">{{ number_format($transaction->amount, 0, ',', ' ') }} DZD</strong>
            @else
              <strong class="negative">{{ number_format($transaction->amount, 0, ',', ' ') }} DZD</strong>
            @endif
          </td>
          <td class="notes-cell">{{ $transaction->note ?? '-' }}</td>
            <td class="timestamp-cell text-center">
            {{ \Carbon\Carbon::parse($transaction->created_at)->format('Y-m-d H:i:s') }}
            </td>

            <td class="timestamp-cell text-center">
            @if ($transaction->updated_at != $transaction->created_at)
                {{ \Carbon\Carbon::parse($transaction->updated_at)->format('Y-m-d H:i:s') }}
            @endif
            </td>
        </tr>
        @endforeach
      </tbody>
    </table>
    @else
    <div class="section-header">No transactions found</div>
    @endif

    <div class="footer">
      Generated on {{ now()->format('Y-m-d H:i:s') }} by {{ $admin->name ?? 'System' }} - &copy; {{ date('Y') }}
    </div>

  </div>
</body>
</html>
