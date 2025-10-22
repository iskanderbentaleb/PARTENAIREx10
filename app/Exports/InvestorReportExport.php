<?php

namespace App\Exports;

use App\Models\Investor;
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
use Carbon\Carbon;

class InvestorReportExport implements FromArray, WithHeadings, WithStyles, WithColumnWidths, WithEvents
{
    protected $investor;
    protected $startDate;
    protected $endDate;

    public function __construct(Investor $investor, $startDate = null, $endDate = null)
    {
        $this->investor = $investor;
        $this->startDate = $startDate;
        $this->endDate = $endDate;
    }

    public function headings(): array
    {
        // Calculate financial metrics (same as your print method)
        $allIn = $this->investor->transactions->where('type', 'In')->sum('amount');
        $allOut = $this->investor->transactions->where('type', 'Out')->sum('amount');
        $totalPurchases = $this->investor->purchases->sum('total');
        $totalSales = $this->investor->sales->sum('total');

        $costOfGoodsSold = 0;
        foreach ($this->investor->purchases as $purchase) {
            if ($purchase->relationLoaded('items') && $purchase->items) {
                foreach ($purchase->items as $item) {
                    $costOfGoodsSold += $item->quantity_selled * $item->unit_price_with_discount;
                }
            }
        }

        $profit = $totalSales - $costOfGoodsSold;
        $availableCash = $allIn - $allOut;

        $cashInProcess = 0;
        foreach ($this->investor->purchases as $purchase) {
            if ($purchase->relationLoaded('items') && $purchase->items) {
                foreach ($purchase->items as $item) {
                    $remainingQuantity = $item->quantity - $item->quantity_selled;
                    if ($remainingQuantity > 0) {
                        $cashInProcess += $remainingQuantity * $item->unit_price_with_discount;
                    }
                }
            }
        }

        $totalCapital = $availableCash + $cashInProcess;

        $dateRangeInfo = '';
        if ($this->startDate && $this->endDate) {
            $dateRangeInfo = " (From " . Carbon::parse($this->startDate)->format('d/m/Y') . " to " . Carbon::parse($this->endDate)->format('d/m/Y') . ")";
        }

        return [
            array_merge(['INVESTOR REPORT - FINANCIAL SUMMARY' . $dateRangeInfo], array_fill(1, 10, '')),
            [],
            array_merge(['INVESTOR INFORMATION'], array_fill(1, 10, '')),
            [
                'Name', 'Email', 'Phone', 'Address', 'Notes',
                '', '', '', '', '', ''
            ],
            [
                $this->investor->name,
                $this->investor->email ?? 'N/A',
                $this->investor->phone ?? 'N/A',
                $this->investor->address ?? 'N/A',
                $this->investor->notes ?? 'No notes',
                '', '', '', '', '', ''
            ],
            [],
            array_merge(['FINANCIAL SUMMARY'], array_fill(1, 10, '')),
            [
                'Total Capital', 'Available Cash', 'Cash in Process', 'Total Profit',
                'Total Invested', 'Total Withdrawn',
                '', '', '', '', ''
            ],
            [
                number_format($totalCapital, 2) . ' DZD',
                number_format($availableCash, 2) . ' DZD',
                number_format($cashInProcess, 2) . ' DZD',
                number_format($profit, 2) . ' DZD',
                number_format($allIn, 2) . ' DZD',
                number_format($allOut, 2) . ' DZD',
                '', '', '', '', ''
            ],
            [],
            array_merge(['DETAILED BREAKDOWN'], array_fill(1, 10, '')),
            [
                'Total Purchases', 'Total Sales', 'Cost of Goods Sold',
                '', '', '', '', ''
            ],
            [
                number_format($totalPurchases, 2) . ' DZD',
                number_format($totalSales, 2) . ' DZD',
                number_format($costOfGoodsSold, 2) . ' DZD',
                '', '', '', '', ''
            ],
            [],
            array_merge(['TRANSACTION HISTORY'], array_fill(1, 10, '')),
            [
                'Date', 'Type', 'Transaction Type', 'Amount (DZD)', 'Payment Method',
                'Reference', 'Notes'
            ],
        ];
    }

    public function array(): array
    {
        $transactions = collect();

        // Filter transactions by date range if provided
        $filteredTransactions = $this->investor->transactions;
        if ($this->startDate && $this->endDate) {
            $filteredTransactions = $this->investor->transactions->filter(function ($transaction) {
                $transactionDate = Carbon::parse($transaction->date);
                return $transactionDate >= $this->startDate && $transactionDate <= $this->endDate;
            });
        }

        foreach ($filteredTransactions as $transaction) {
            $transactionDate = Carbon::parse($transaction->date);
            $transactions->push([
                $transactionDate->format('d/m/Y'),
                $transaction->type, // In or Out
                $this->getTransactionType($transaction),
                number_format($transaction->amount, 2),
                $transaction->payment_method ?? '-',
                $transaction->reference ?? '-',
                $transaction->note ?? '-',
                'sort_date' => $transactionDate->timestamp,
            ]);
        }

        // Sort by date (most recent first, like in your print method)
        return $transactions->sortByDesc('sort_date')
            ->map(function ($item) {
                // Remove sorting keys from output
                return array_slice($item, 0, 7);
            })
            ->values()
            ->toArray();
    }

    private function getTransactionType($transaction): string
    {
        if ($transaction->purchase_id) {
            return 'PURCHASE';
        } elseif ($transaction->sale_id) {
            return 'SALE';
        } else {
            return 'MANUAL';
        }
    }

    public function styles(Worksheet $sheet)
    {
        $transactionsStartRow = 18;
        $transactionsCount = count($this->array());
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
            15 => [
                'font' => ['bold' => true, 'color' => ['rgb' => 'FFFFFF']],
                'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => '2F5597']],
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
                'font' => ['bold' => true],
                'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER],
                'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => 'D9E1F2']],
                'borders' => ['allBorders' => ['borderStyle' => Border::BORDER_THIN]],
            ],
            13 => [
                'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER],
                'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => 'F2F2F2']],
                'borders' => ['allBorders' => ['borderStyle' => Border::BORDER_THIN]],
            ],
            16 => [
                'font' => ['bold' => true, 'color' => ['rgb' => 'FFFFFF']],
                'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER],
                'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => '2F5597']],
                'borders' => ['allBorders' => ['borderStyle' => Border::BORDER_THIN]],
            ],
        ];

        // Apply alternating background for transactions
        for ($i = $transactionsStartRow; $i < $transactionsStartRow + $transactionsCount; $i++) {
            $transactionType = $sheet->getCell("B{$i}")->getValue();
            $isIn = $transactionType === 'In';

            $styles[$i] = [
                'fill' => [
                    'fillType' => Fill::FILL_SOLID,
                    'startColor' => ['rgb' => $isIn ? 'F0FFF0' : 'FFF0F0']
                ],
                'borders' => ['allBorders' => ['borderStyle' => Border::BORDER_THIN]],
            ];

            // Style amount column based on transaction type
            if ($isIn) {
                $styles["D{$i}"] = [
                    'font' => ['bold' => true, 'color' => ['rgb' => '2D7D32']],
                ];
            } else {
                $styles["D{$i}"] = [
                    'font' => ['bold' => true, 'color' => ['rgb' => 'C62828']],
                ];
            }
        }

        return $styles;
    }

    public function columnWidths(): array
    {
        return [
            'A' => 12, // Date
            'B' => 10, // Type (In/Out)
            'C' => 15, // Transaction Type
            'D' => 15, // Amount
            'E' => 15, // Payment Method
            'F' => 20, // Reference
            'G' => 30, // Notes
        ];
    }

    public function registerEvents(): array
    {
        return [
            AfterSheet::class => function (AfterSheet $event) {
                $sheet = $event->sheet;
                $transactionsStartRow = 18;
                $transactionsCount = count($this->array());
                $transactionsEndRow = $transactionsStartRow + $transactionsCount;
                $lastColumn = 'G';

                // Merge header cells
                $sheet->mergeCells("A1:{$lastColumn}1");
                $sheet->mergeCells("A3:{$lastColumn}3");
                $sheet->mergeCells("A7:{$lastColumn}7");
                $sheet->mergeCells("A11:{$lastColumn}11");
                $sheet->mergeCells("A15:{$lastColumn}15");

                // Adjust row heights
                $sheet->getRowDimension(1)->setRowHeight(25);
                $sheet->getRowDimension(3)->setRowHeight(20);
                $sheet->getRowDimension(7)->setRowHeight(20);
                $sheet->getRowDimension(11)->setRowHeight(20);
                $sheet->getRowDimension(15)->setRowHeight(20);

                // Freeze header
                $sheet->freezePane("A{$transactionsStartRow}");

                // Format numbers
                $sheet->getStyle("D{$transactionsStartRow}:D{$transactionsEndRow}")
                    ->getNumberFormat()
                    ->setFormatCode('#,##0.00');

                // Apply auto-filter
                if ($transactionsCount > 0) {
                    $sheet->setAutoFilter("A16:{$lastColumn}16");
                }

                // Add transaction totals
                if ($transactionsCount > 0) {
                    $totalsRow = $transactionsEndRow + 1;

                    // Total In
                    $sheet->setCellValue("C{$totalsRow}", "TOTAL IN:");
                    $sheet->setCellValue("D{$totalsRow}", number_format($this->investor->transactions->where('type', 'In')->sum('amount'), 2));
                    $sheet->getStyle("A{$totalsRow}:G{$totalsRow}")->applyFromArray([
                        'font' => ['bold' => true, 'color' => ['rgb' => '2D7D32']],
                        'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => 'E8F5E8']],
                        'borders' => ['allBorders' => ['borderStyle' => Border::BORDER_THIN]],
                    ]);

                    // Total Out
                    $outRow = $totalsRow + 1;
                    $sheet->setCellValue("C{$outRow}", "TOTAL OUT:");
                    $sheet->setCellValue("D{$outRow}", number_format($this->investor->transactions->where('type', 'Out')->sum('amount'), 2));
                    $sheet->getStyle("A{$outRow}:G{$outRow}")->applyFromArray([
                        'font' => ['bold' => true, 'color' => ['rgb' => 'C62828']],
                        'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => 'FFEBEE']],
                        'borders' => ['allBorders' => ['borderStyle' => Border::BORDER_THIN]],
                    ]);

                    // Net Flow
                    $netRow = $outRow + 1;
                    $netFlow = $this->investor->transactions->where('type', 'In')->sum('amount') -
                              $this->investor->transactions->where('type', 'Out')->sum('amount');
                    $sheet->setCellValue("C{$netRow}", "NET FLOW:");
                    $sheet->setCellValue("D{$netRow}", number_format($netFlow, 2));
                    $netColor = $netFlow >= 0 ? 'E8F5E8' : 'FFEBEE';
                    $textColor = $netFlow >= 0 ? '2D7D32' : 'C62828';
                    $sheet->getStyle("A{$netRow}:G{$netRow}")->applyFromArray([
                        'font' => ['bold' => true, 'color' => ['rgb' => $textColor]],
                        'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => $netColor]],
                        'borders' => ['allBorders' => ['borderStyle' => Border::BORDER_MEDIUM]],
                    ]);

                    // Add currency labels
                    $sheet->setCellValue("G{$totalsRow}", "DZD");
                    $sheet->setCellValue("G{$outRow}", "DZD");
                    $sheet->setCellValue("G{$netRow}", "DZD");
                }
            },
        ];
    }
}
