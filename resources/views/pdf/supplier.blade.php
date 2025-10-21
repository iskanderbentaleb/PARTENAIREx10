<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Rapport Fournisseur - {{ $supplier->name }}</title>
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

    .supplier-info {
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
      color: #28a745;
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
      font-size: 10px;
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

    .type-purchase {
      background-color: #f0f8ff;
    }

    .type-payment {
      background-color: #f0fff0;
    }

    .notes-cell {
      max-width: 150px;
      word-wrap: break-word;
    }

    .footer {
      margin-top: 20px;
      text-align: center;
      font-size: 10px;
      color: #888;
      border-top: 1px solid #e0e0e0;
      padding-top: 8px;
    }

    /* Totals Rows */
    .totals-row {
      background-color: #e8e8e81c !important;
      font-weight: bold;
    }

    .totals-row td {
      border-top: 1px solid #666;
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

    <div class="document-title">Rapport Fournisseur - {{ $supplier->name }}</div>

    @if($startDate && $endDate)
        <div style="text-align: center; margin-bottom: 10px; font-size: 12px; color: #666;">
            Période: {{ \Carbon\Carbon::parse($startDate)->format('d/m/Y') }} - {{ \Carbon\Carbon::parse($endDate)->format('d/m/Y') }}
        </div>
    @endif

    <div class="supplier-info">
      <div class="info-grid">
        <div class="info-item">
          <span class="info-label">Nom:</span>
          <span>{{ $supplier->name }}</span>
        </div>
        <div class="info-item">
          <span class="info-label">Téléphone:</span>
          <span>{{ $supplier->phone ?? 'N/A' }}</span>
        </div>
        <div class="info-item">
          <span class="info-label">Email:</span>
          <span>{{ $supplier->email ?? 'N/A' }}</span>
        </div>
        <div class="info-item">
          <span class="info-label">Adresse:</span>
          <span>{{ $supplier->address ?? 'N/A' }}</span>
        </div>
      </div>
      @if($supplier->notes)
      <div class="info-item" style="margin-top: 8px;">
        <span class="info-label">Notes:</span>
        <span>{{ $supplier->notes }}</span>
      </div>
      @endif
    </div>

    <!-- Summary Table -->
    <table class="summary-table">
      <tr>
        <td class="summary-label">Total Achats:</td>
        <td class="summary-value">{{ number_format($totalPurchases, 2, ',', ' ') }} DZD</td>
      </tr>
      <tr>
        <td class="summary-label">Total Remise:</td>
        <td class="summary-value">{{ number_format($totalDiscount, 2, ',', ' ') }} DZD</td>
      </tr>
      <tr>
        <td class="summary-label">Total Livraison:</td>
        <td class="summary-value">{{ number_format($totalShipping, 2, ',', ' ') }} DZD</td>
      </tr>
      <tr>
        <td class="summary-label">Total Paiements:</td>
        <td class="summary-value positive">{{ number_format($totalPayments, 2, ',', ' ') }} DZD</td>
      </tr>
      <tr>
        <td class="summary-label">Solde Actuel:</td>
        <td class="summary-value {{ $currentBalance >= 0 ? 'negative' : 'positive' }}">
          {{ number_format($currentBalance, 2, ',', ' ') }} DZD
        </td>
      </tr>
    </table>

    <!-- Transactions Table -->
    @if($transactions->count() > 0)
    <div class="section-header">Historique des Transactions ({{ $transactions->count() }})</div>
    <table class="data-table">
      <thead>
        <tr>
          <th>Date</th>
          <th>Type</th>
          <th>Facture</th>
          <th>Sous-total</th>
          <th>Remise</th>
          <th>Livraison</th>
          <th>Montant</th>
          <th>Notes</th>
        </tr>
      </thead>
      <tbody>
        @foreach($transactions as $transaction)
        <tr class="type-{{ $transaction['type'] }}">
        <td class="text-center">
            {{ $transaction['date']->format('d/m/Y') }}
        </td>
        <td class="text-center">
            @if($transaction['type'] == 'purchase')
            <strong>ACHAT</strong>
            @else
            <strong class="positive">PAIEMENT</strong>
            @endif
        </td>
        <td>{{ $transaction['invoice_number'] ?? '-' }}</td>
        <td class="text-right">
            @if($transaction['type'] == 'purchase')
            {{ number_format($transaction['subtotal'], 2, ',', ' ') }}
            @else
            -
            @endif
        </td>
        <td class="text-right">
            @if($transaction['type'] == 'purchase')
            {{ number_format($transaction['discount'], 2, ',', ' ') }}
            @else
            -
            @endif
        </td>
        <td class="text-right">
            @if($transaction['type'] == 'purchase')
            {{ number_format($transaction['shipping'], 2, ',', ' ') }}
            @else
            -
            @endif
        </td>
        <td class="text-right">
            @if($transaction['type'] == 'purchase')
            <strong>{{ number_format($transaction['total'], 2, ',', ' ') }} DZD</strong>
            @else
            <strong class="positive">{{ number_format($transaction['amount'], 2, ',', ' ') }} DZD</strong>
            @endif
        </td>
        <td class="notes-cell">{{ $transaction['note'] ?? '-' }}</td>
        </tr>
        @endforeach

        <!-- Purchase Totals Row -->
        <tr class="totals-row">
          <td colspan="3" class="text-right"><strong>TOTAUX ACHATS:</strong></td>
          <td class="text-right"><strong>{{ number_format($totalSubtotal, 2, ',', ' ') }}</strong></td>
          <td class="text-right"><strong>{{ number_format($totalDiscount, 2, ',', ' ') }}</strong></td>
          <td class="text-right"><strong>{{ number_format($totalShipping, 2, ',', ' ') }}</strong></td>
          <td class="text-right"><strong>{{ number_format($totalPurchases, 2, ',', ' ') }} DZD</strong></td>
          <td></td>
        </tr>

        <!-- Payments Total Row -->
        <tr class="totals-row">
          <td colspan="6" class="text-right"><strong>TOTAL PAIEMENTS:</strong></td>
          <td class="text-right"><strong class="positive">{{ number_format($totalPayments, 2, ',', ' ') }} DZD</strong></td>
          <td></td>
        </tr>

        <!-- Grand Total Row -->
        <tr class="grand-total-row">
          <td colspan="6" class="text-right"><strong>SOLDE FINAL:</strong></td>
          <td class="text-right"><strong class="{{ $currentBalance >= 0 ? 'negative' : 'positive' }}">
            {{ number_format($currentBalance, 2, ',', ' ') }} DZD
          </strong></td>
          <td></td>
        </tr>
      </tbody>
    </table>
    @else
    <div class="section-header">Aucune transaction trouvée</div>
    @endif

    <div class="footer">
      Généré le {{ now()->format('d/m/Y H:i') }} par {{ $admin->name ?? 'Système' }} - &copy; {{ date('Y') }}
    </div>

  </div>
</body>
</html>
