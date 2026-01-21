<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\App;
use Illuminate\Support\Facades\Session;

/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
*/

// 🌍 语言切换（保留）
Route::get('/lang/{locale}', function ($locale) {

    if (!in_array($locale, ['en', 'zh', 'km'])) {
        abort(404);
    }

    Session::put('locale', $locale);
    App::setLocale($locale);

    return redirect()->back();
});

// 🟢 Vue 前端入口（兜底路由，必须放最后）
Route::get('/{any}', function () {
    return view('app');
})->where('any', '.*');
