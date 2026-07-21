<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use App\Models\User;
use App\Models\Product;
use App\Models\Location;

class PerformanceTestSeeder extends Seeder
{
    public function run()
    {
        $this->command->info('Starting Performance Test Simulation...');
        
        $users = User::pluck('id')->toArray();
        $products = Product::pluck('id')->toArray();
        $locations = Location::pluck('id')->toArray();

        $chunkSize = 1000;
        $totalRecords = 10000;

        for ($i = 0; $i < $totalRecords / $chunkSize; $i++) {
            $transactions = [];
            $logs = [];
            
            for ($j = 0; $j < $chunkSize; $j++) {
                $trxId = Str::uuid()->toString();
                $now = now()->subMinutes(rand(1, 10000))->toDateTimeString();

                $transactions[] = [
                    'id' => $trxId,
                    'transaction_code' => 'TRX-PT-' . Str::random(8),
                    'type' => 'INBOUND',
                    'status' => 'APPROVED',
                    'product_id' => $products[array_rand($products)],
                    'destination_location_id' => $locations[array_rand($locations)],
                    'quantity' => rand(1, 100),
                    'operator_id' => $users[array_rand($users)],
                    'created_at' => $now,
                    'updated_at' => $now,
                ];

                $logs[] = [
                    'id' => Str::uuid()->toString(),
                    'user_id' => $users[array_rand($users)],
                    'action' => 'APPROVAL',
                    'model_type' => 'InventoryTransaction',
                    'model_id' => $trxId,
                    'description' => 'Load testing insert',
                    'created_at' => $now,
                    'updated_at' => $now,
                ];
            }

            DB::table('inventory_transactions')->insert($transactions);
            DB::table('activity_logs')->insert($logs);
            
            $this->command->info("Inserted chunk " . ($i + 1) . " / " . ($totalRecords / $chunkSize));
        }

        $this->command->info('Performance Data Seeded. Running EXPLAIN on queries...');

        // Test Slow Query
        $start = microtime(true);
        $pending = DB::table('inventory_transactions')->where('status', 'PENDING')->get();
        $time1 = microtime(true) - $start;
        $this->command->info("Time to fetch PENDING without index: " . round($time1 * 1000, 2) . "ms");

        $start2 = microtime(true);
        $logs = DB::table('activity_logs')->orderBy('created_at', 'desc')->limit(20)->get();
        $time2 = microtime(true) - $start2;
        $this->command->info("Time to fetch Logs without index: " . round($time2 * 1000, 2) . "ms");
    }
}
