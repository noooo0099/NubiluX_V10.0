<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return view('welcome');
});

// Serve the React frontend
Route::get('/{any}', function () {
    return view('app');
})->where('any', '.*');