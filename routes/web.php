<?php

use App\Http\Controllers\Admin\WheelController as AdminWheelController;
use App\Http\Controllers\PublicWheelLandingController;
use App\Http\Controllers\WheelController;
use Illuminate\Support\Facades\Route;

// Public landing — list of all published wheels.
Route::get('/', PublicWheelLandingController::class)
    ->name('home');

// Public wheel pages — slug-based, each wheel is a standalone page.
Route::get('w/{wheel:slug}', [WheelController::class, 'show'])->name('wheel.show');
Route::post('w/{wheel:slug}/spin', [WheelController::class, 'spin'])->name('wheel.spin');

Route::middleware(['auth', 'verified'])->group(function () {
    // Dashboard root IS the merchant's wheels list.
    Route::get('dashboard', [AdminWheelController::class, 'index'])->name('dashboard');

    Route::prefix('admin')->name('admin.')->group(function () {
        Route::resource('wheels', AdminWheelController::class)->except(['show']);
    });
});

require __DIR__.'/settings.php';
