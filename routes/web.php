<?php

use App\Http\Controllers\InvestorController;
use App\Http\Controllers\PurchaseController;
use App\Http\Controllers\SaleController;
use App\Http\Controllers\SupplierController;
use App\Http\Controllers\SupplierTransactionController;
use App\Models\SupplierTransaction;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('welcome');
})->name('home');

Route::middleware(['auth', 'verified'])->group(function () {

    // dashboard route
    Route::get('dashboard', function () {
        return Inertia::render('dashboard');
    })->name('dashboard');

    // suppliers routes
    Route::get('suppliers', [SupplierController::class, 'index'])->name('suppliers');
    Route::delete('suppliers/delete/{id}', [SupplierController::class, 'destroy'])->name('suppliers.destroy');
    Route::get('suppliers/create', [SupplierController::class, 'create'])->name('suppliers.create');
    Route::post('suppliers', [SupplierController::class, 'store'])->name('suppliers.store');
    Route::get('suppliers/edit/{id}', [SupplierController::class, 'edit'])->name('suppliers.edit');
    Route::put('suppliers/{id}', action: [SupplierController::class, 'update'])->name('suppliers.update');
    Route::get('suppliers/{supplier}/financial-data', [SupplierController::class, 'financialData']);

    // investors routes
    Route::get('investors', [InvestorController::class, 'index'])->name('investors');
    Route::delete('investors/delete/{id}', [InvestorController::class, 'destroy'])->name('investors.destroy');
    Route::get('investors/create', [InvestorController::class, 'create'])->name('investors.create');
    Route::post('investors', [InvestorController::class, 'store'])->name('investors.store');
    Route::get('investors/edit/{id}', [InvestorController::class, 'edit'])->name('investors.edit');
    Route::put('investors/{id}', action: [InvestorController::class, 'update'])->name('investors.update');


    // purchases routes
    Route::get('purchases', [PurchaseController::class, 'index'])->name('purchases');
    Route::get('purchases/view/{id}', [PurchaseController::class, 'show'])->name('purchases.show'); // Add this line
    Route::get('purchases/download-invoice/{purchase}', [PurchaseController::class, 'downloadInvoice'])->name('purchases.download-invoice');
    Route::delete('purchases/delete/{id}', [PurchaseController::class, 'destroy'])->name('purchases.destroy');
    Route::get('purchases/create', [PurchaseController::class, 'create'])->name('purchases.create');
    Route::post('purchases', [PurchaseController::class, 'store'])->name('purchases.store');
    Route::get('purchases/edit/{id}', [PurchaseController::class, 'edit'])->name('purchases.edit');
    Route::post('purchases/update/{id}', [PurchaseController::class, 'update'])->name('purchases.update');


    // supplierTransactions routes
    Route::get('supplier_transactions', [SupplierTransactionController::class, 'index'])->name('supplier_transactions');
    Route::get('supplier_transactions/create', [SupplierTransactionController::class, 'create'])->name('supplier_transactions.create');
    Route::post('supplier_transactions', [SupplierTransactionController::class, 'store'])->name('supplier_transactions.store');
    Route::get('supplier_transactions/edit/{id}', [SupplierTransactionController::class, 'edit'])->name('supplier_transactions.edit');
    Route::put('supplier_transactions/{id}', action: [SupplierTransactionController::class, 'update'])->name('supplier_transactions.update');
    Route::delete('supplier_transactions/delete/{id}', [SupplierTransactionController::class, 'destroy'])->name('supplier_transactions.destroy');



    // sales routes
    Route::get('sales', [SaleController::class, 'index'])->name('sales');
    Route::get('sales/create', [SaleController::class, 'create'])->name('sales.create');
    Route::post('sales', [SaleController::class, 'store'])->name('sales.store');
    Route::get('api/investor/{investorId}/purchase-items', [SaleController::class, 'getInvestorPurchaseItems'])->name('api.investor.purchase-items');

    // Route::get('purchases/view/{id}', [PurchaseController::class, 'show'])->name('purchases.show'); // Add this line
    // Route::get('purchases/download-invoice/{purchase}', [PurchaseController::class, 'downloadInvoice'])->name('purchases.download-invoice');
    // Route::delete('purchases/delete/{id}', [PurchaseController::class, 'destroy'])->name('purchases.destroy');


    // Route::get('purchases/edit/{id}', [PurchaseController::class, 'edit'])->name('purchases.edit');
    // Route::post('purchases/update/{id}', [PurchaseController::class, 'update'])->name('purchases.update');






});

require __DIR__.'/settings.php';
require __DIR__.'/auth.php';
