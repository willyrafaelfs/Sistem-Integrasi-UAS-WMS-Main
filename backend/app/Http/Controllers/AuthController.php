<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Laravel\Socialite\Facades\Socialite;

class AuthController extends Controller
{
    public function user(Request $request)
    {
        return $request->user();
    }

    public function login(Request $request)
    {
        $request->validate([
            'username' => 'required',
            'password' => 'required',
        ]);

        $user = User::where('username', $request->username)->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            throw ValidationException::withMessages([
                'username' => ['Kredensial yang diberikan tidak cocok dengan data kami.'],
            ]);
        }

        if (!$user->is_active) {
            throw ValidationException::withMessages([
                'username' => ['Akun Anda tidak aktif. Silakan hubungi admin.'],
            ]);
        }

        $token = $user->createToken('wms-token')->plainTextToken;

        return response()->json([
            'token' => $token,
            'user' => [
                'id' => $user->id,
                'username' => $user->username,
                'full_name' => $user->full_name,
                'role' => $user->role,
            ]
        ]);
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'message' => 'Berhasil logout'
        ]);
    }

    /**
     * Redirect the user to Google's OAuth consent screen.
     */
    public function googleRedirect()
    {
        return Socialite::driver('google')->stateless()->redirect();
    }

    /**
     * Handle the callback from Google, then hand a Sanctum token back to the SPA.
     */
    public function googleCallback()
    {
        $frontend = rtrim(env('FRONTEND_URL', 'http://localhost:5173'), '/');

        try {
            $googleUser = Socialite::driver('google')->stateless()->user();
        } catch (\Throwable $e) {
            return redirect($frontend . '/auth/callback?error=google_failed');
        }

        // Match by google_id first, then fall back to email so existing accounts get linked.
        $user = User::where('google_id', $googleUser->getId())
            ->orWhere('email', $googleUser->getEmail())
            ->first();

        if (!$user) {
            $user = User::create([
                'id' => (string) Str::uuid(),
                'google_id' => $googleUser->getId(),
                'full_name' => $googleUser->getName() ?: $googleUser->getNickname() ?: 'Google User',
                'email' => $googleUser->getEmail(),
                'username' => Str::before($googleUser->getEmail(), '@') . '-' . Str::random(4),
                'avatar' => $googleUser->getAvatar(),
                'role' => 'operator',
                'is_active' => true,
            ]);
        } elseif (!$user->google_id) {
            // Link Google to an existing (password-based) account.
            $user->google_id = $googleUser->getId();
            $user->avatar = $user->avatar ?: $googleUser->getAvatar();
            $user->save();
        }

        if (!$user->is_active) {
            return redirect($frontend . '/auth/callback?error=inactive');
        }

        $token = $user->createToken('wms-token')->plainTextToken;

        return redirect($frontend . '/auth/callback?token=' . urlencode($token));
    }
}
