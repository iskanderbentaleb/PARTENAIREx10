<?php

namespace App\Exports;

use App\Models\Supplier;
use Maatwebsite\Excel\Concerns\FromArray;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\WithColumnWidths;
use Maatwebsite\Excel\Concerns\WithEvents;
use Maatwebsite\Excel\Events\AfterSheet;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Border;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Style\NumberFormat;
use Carbon\Carbon;

class SupplierReportExport implements FromArray, WithHeadings, WithStyles, WithColumnWidths, WithEvents
{
    protected $supplier;

    public function __construct(Supplier $supplier)
    {
        $this->supplier = $supplier;
    }

    public function headings(): array
    {
        // Calculate totals
        $totalPurchases = $this->supplier->purchases_sum_total ?? 0;
        $totalPayments = $this->supplier->transactions_sum_amount ?? 0;
        $currentBalance = $totalPurchases - $totalPayments;
        $totalSubtotal = $this->supplier->purchases->sum('subtotal');
        $totalDiscount = $this->supplier->purchases->sum('discount_value');
        $totalShipping = $this->supplier->purchases->sum('shipping_value');

        return [
            array_merge(['RAPPORT FOURNISSEUR - SYNTHÈSE FINANCIÈRE'], array_fill(1, 10, '')),
            [],
            array_merge(['INFORMATIONS FOURNISSEUR'], array_fill(1, 10, '')),
            [
                'Nom', 'Email', 'Téléphone', 'Adresse', 'Notes',
                '', '', '', '', '', ''
            ],
            [
                $this->supplier->name,
                $this->supplier->email ?? 'N/A',
                $this->supplier->phone ?? 'N/A',
                $this->supplier->address ?? 'N/A',
                $this->supplier->notes ?? 'Aucune note',
                '', '', '', '', '', ''
            ],
            [],
            array_merge(['RÉSUMÉ FINANCIER'], array_fill(1, 10, '')),
            [
                'Total Achats', 'Sous-total', 'Total Remise', 'Total Livraison',
                'Total Paiements', 'Solde Actuel',
                '', '', '', '', ''
            ],
            [
                number_format($totalPurchases, 2) . ' DZD',
                number_format($totalSubtotal, 2) . ' DZD',
                number_format($totalDiscount, 2) . ' DZD',
                number_format($totalShipping, 2) . ' DZD',
                number_format($totalPayments, 2) . ' DZD',
                number_format($currentBalance, 2) . ' DZD',
                '', '', '', '', ''
            ],
            [],
            array_merge(['HISTORIQUE DES TRANSACTIONS'], array_fill(1, 10, '')),
            [
                'Date', 'Type', 'Facture', 'Sous-total (DZD)', 'Remise (DZD)',
                'Livraison (DZD)', 'Montant (DZD)', 'Notes'
            ],
        ];
    }

    public function array(): array
    {
        $transactions = collect();

        // Add purchases
        foreach ($this->supplier->purchases as $purchase) {
            $purchaseDate = Carbon::parse($purchase->purchase_date);
            $transactions->push([
                $purchaseDate->format('d/m/Y'),
                'ACHAT',
                $purchase->supplier_invoice_number,
                number_format($purchase->subtotal, 2),
                number_format($purchase->discount_value, 2),
                number_format($purchase->shipping_value, 2),
                number_format($purchase->total, 2),
                $purchase->note ?? '-',
                'sort_date' => $purchaseDate->timestamp,
                'sort_priority' => 1,
            ]);
        }

        // Add payments (only non-zero amounts)
        foreach ($this->supplier->transactions as $transaction) {
            if ($transaction->amount != 0) {
                $transactionDate = Carbon::parse($transaction->date);
                $transactions->push([
                    $transactionDate->format('d/m/Y'),
                    'PAIEMENT',
                    $transaction->purchase?->supplier_invoice_number ?? '-',
                    '-',
                    '-',
                    '-',
                    number_format($transaction->amount, 2),
                    $transaction->note ?? '-',
                    'sort_date' => $transactionDate->timestamp,
                    'sort_priority' => 2,
                ]);
            }
        }

        // Sort by date and priority (purchases first, then payments on same date)
        return $transactions->sortBy([
            ['sort_date', 'asc'],
            ['sort_priority', 'asc']
        ])->map(function ($item) {
            // Remove the sort keys from the final array
            return array_slice($item, 0, 8);
        })->values()->toArray();
    }

    public function styles(Worksheet $sheet)
    {
        $transactionsStartRow = 13;
        $transactionsCount = count($this->supplier->purchases) + $this->supplier->transactions->where('amount', '!=', 0)->count();
        $transactionsEndRow = $transactionsStartRow + $transactionsCount;

        $sheet->getParent()->getDefaultStyle()->applyFromArray([
            'font' => ['name' => 'Calibri', 'size' => 10],
            'alignment' => ['vertical' => Alignment::VERTICAL_CENTER],
        ]);

        $styles = [
            1 => [
                'font' => ['bold' => true, 'size' => 16, 'color' => ['rgb' => 'FFFFFF']],
                'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER],
                'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => '2F5597']],
            ],
            3 => [
                'font' => ['bold' => true, 'size' => 12, 'color' => ['rgb' => 'FFFFFF']],
                'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => '2F5597']],
            ],
            7 => [
                'font' => ['bold' => true, 'size' => 12, 'color' => ['rgb' => 'FFFFFF']],
                'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => '2F5597']],
            ],
            11 => [
                'font' => ['bold' => true, 'color' => ['rgb' => 'FFFFFF']],
                'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => '4472C4']],
            ],
            4 => [
                'font' => ['bold' => true],
                'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => 'D9E1F2']],
            ],
            8 => [
                'font' => ['bold' => true],
                'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER],
                'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => 'BDD7EE']],
                'borders' => ['allBorders' => ['borderStyle' => Border::BORDER_THIN]],
            ],
            9 => [
                'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER],
                'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => 'E7E6E6']],
                'borders' => ['allBorders' => ['borderStyle' => Border::BORDER_THIN]],
                'font' => ['bold' => true],
            ],
            12 => [
                'font' => ['bold' => true, 'color' => ['rgb' => 'FFFFFF']],
                'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER],
                'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => '2F5597']],
                'borders' => ['allBorders' => ['borderStyle' => Border::BORDER_THIN]],
            ],
        ];

        // Style transaction rows with zebra striping and color coding
        for ($i = $transactionsStartRow; $i < $transactionsStartRow + $transactionsCount; $i++) {
            $transactionType = $sheet->getCell("B{$i}")->getValue();
            $isPurchase = $transactionType === 'ACHAT';

            $styles[$i] = [
                'fill' => [
                    'fillType' => Fill::FILL_SOLID,
                    'startColor' => ['rgb' => $isPurchase ? 'F0F8FF' : 'F0FFF0']
                ],
                'borders' => ['allBorders' => ['borderStyle' => Border::BORDER_THIN]],
            ];

            // Style amount column based on type
            if ($isPurchase) {
                $styles["G{$i}"] = [
                    'font' => ['bold' => true, 'color' => ['rgb' => '1F4E79']],
                ];
            } else {
                $styles["G{$i}"] = [
                    'font' => ['bold' => true, 'color' => ['rgb' => '2D7D32']],
                ];
            }
        }

        // Style financial summary numbers
        $styles["A9:F9"] = [
            'font' => ['bold' => true],
            'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER],
        ];

        return $styles;
    }

    public function columnWidths(): array
    {
        return [
            'A' => 12, // Date
            'B' => 12, // Type
            'C' => 20, // Invoice
            'D' => 15, // Subtotal
            'E' => 15, // Discount
            'F' => 15, // Shipping
            'G' => 15, // Amount
            'H' => 30, // Notes
        ];
    }

    public function registerEvents(): array
    {
        return [
            AfterSheet::class => function (AfterSheet $event) {
                $sheet = $event->sheet;
                $transactionsStartRow = 13;
                $transactionsCount = count($this->supplier->purchases) + $this->supplier->transactions->where('amount', '!=', 0)->count();
                $transactionsEndRow = $transactionsStartRow + $transactionsCount;
                $lastColumn = 'H';

                // Merge title cells
                $sheet->mergeCells("A1:{$lastColumn}1");
                $sheet->mergeCells("A3:{$lastColumn}3");
                $sheet->mergeCells("A7:{$lastColumn}7");
                $sheet->mergeCells("A11:{$lastColumn}11");

                // Set row heights
                $sheet->getRowDimension(1)->setRowHeight(25);
                $sheet->getRowDimension(3)->setRowHeight(20);
                $sheet->getRowDimension(7)->setRowHeight(20);
                $sheet->getRowDimension(11)->setRowHeight(20);

                // Freeze panes at transactions start
                $sheet->freezePane("A{$transactionsStartRow}");

                // Set number format for amount columns
                $sheet->getStyle("D{$transactionsStartRow}:G{$transactionsEndRow}")
                    ->getNumberFormat()
                    ->setFormatCode('#,##0.00');

                // Add auto-filter to transactions
                if ($transactionsCount > 0) {
                    $sheet->setAutoFilter("A12:{$lastColumn}12");
                }

                // Add totals row for transactions
                if ($transactionsCount > 0) {
                    $totalsRow = $transactionsEndRow + 1;

                    // Purchase totals
                    $sheet->setCellValue("C{$totalsRow}", "TOTAUX ACHATS:");
                    $sheet->setCellValue("D{$totalsRow}", number_format($this->supplier->purchases->sum('subtotal'), 2));
                    $sheet->setCellValue("E{$totalsRow}", number_format($this->supplier->purchases->sum('discount_value'), 2));
                    $sheet->setCellValue("F{$totalsRow}", number_format($this->supplier->purchases->sum('shipping_value'), 2));
                    $sheet->setCellValue("G{$totalsRow}", number_format($this->supplier->purchases_sum_total ?? 0, 2));

                    // Style totals row
                    $sheet->getStyle("A{$totalsRow}:H{$totalsRow}")->applyFromArray([
                        'font' => ['bold' => true],
                        'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => 'FFF2CC']],
                        'borders' => ['allBorders' => ['borderStyle' => Border::BORDER_THIN]],
                    ]);

                    // Payments total
                    $paymentsRow = $totalsRow + 1;
                    $sheet->setCellValue("C{$paymentsRow}", "TOTAL PAIEMENTS:");
                    $sheet->setCellValue("G{$paymentsRow}", number_format($this->supplier->transactions_sum_amount ?? 0, 2));
                    $sheet->getStyle("A{$paymentsRow}:H{$paymentsRow}")->applyFromArray([
                        'font' => ['bold' => true, 'color' => ['rgb' => '2D7D32']],
                        'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => 'E8F5E8']],
                        'borders' => ['allBorders' => ['borderStyle' => Border::BORDER_THIN]],
                    ]);

                    // Final balance
                    $balanceRow = $paymentsRow + 1;
                    $currentBalance = ($this->supplier->purchases_sum_total ?? 0) - ($this->supplier->transactions_sum_amount ?? 0);
                    $sheet->setCellValue("C{$balanceRow}", "SOLDE FINAL:");
                    $sheet->setCellValue("G{$balanceRow}", number_format($currentBalance, 2));
                    $balanceColor = $currentBalance >= 0 ? 'FFCDD2' : 'C8E6C9';
                    $textColor = $currentBalance >= 0 ? 'C62828' : '2E7D32';
                    $sheet->getStyle("A{$balanceRow}:H{$balanceRow}")->applyFromArray([
                        'font' => ['bold' => true, 'color' => ['rgb' => $textColor]],
                        'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => $balanceColor]],
                        'borders' => ['allBorders' => ['borderStyle' => Border::BORDER_MEDIUM]],
                    ]);

                    // Add currency labels
                    $sheet->setCellValue("H{$totalsRow}", "DZD");
                    $sheet->setCellValue("H{$paymentsRow}", "DZD");
                    $sheet->setCellValue("H{$balanceRow}", "DZD");
                }
            },
        ];
    }
}
