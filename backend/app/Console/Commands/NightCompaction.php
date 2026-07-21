<?php

namespace App\Console\Commands;

use App\Models\InventoryStock;
use App\Models\InventoryTransaction;
use App\Models\Location;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class NightCompaction extends Command
{
    protected $signature = 'wms:night-compaction';
    protected $description = 'WMS-SAM Night Compaction: Konsolidasi palet setengah kosong & reorganisasi zona ABC untuk mengoptimalkan ruang gudang.';

    public function handle()
    {
        $this->info('========================================');
        $this->info(' WMS-SAM NIGHT COMPACTION ENGINE');
        $this->info(' Started at: ' . now()->toDateTimeString());
        $this->info('========================================');

        $logs = [];

        try {
            DB::beginTransaction();

            // =============================================
            // PHASE 1: CONSOLIDATE FRAGMENTED STOCKS
            // Gabungkan stok produk yang sama tapi tersebar di banyak lokasi
            // ke lokasi dengan stok terbanyak (mengurangi honeycombing)
            // =============================================
            $this->info("\n[PHASE 1] Consolidating fragmented stocks...");
            $logs[] = ['phase' => 1, 'action' => 'CONSOLIDATION_START', 'message' => 'Mulai konsolidasi stok terfragmentasi'];

            $fragmentedProducts = InventoryStock::select('product_id')
                ->where('quantity', '>', 0)
                ->groupBy('product_id')
                ->havingRaw('COUNT(*) > 1')
                ->pluck('product_id');

            $consolidations = 0;

            foreach ($fragmentedProducts as $productId) {
                $stocks = InventoryStock::where('product_id', $productId)
                    ->where('quantity', '>', 0)
                    ->orderBy('quantity', 'desc')
                    ->get();

                if ($stocks->count() <= 1) continue;

                // Target: lokasi dengan stok terbanyak
                $target = $stocks->first();
                $sources = $stocks->slice(1);

                foreach ($sources as $source) {
                    $movedQty = $source->quantity;

                    // Log the movement
                    InventoryTransaction::create([
                        'transaction_code' => 'COMPACT-' . strtoupper(Str::random(6)),
                        'type' => 'TRANSFER',
                        'product_id' => $productId,
                        'source_location_id' => $source->location_id,
                        'destination_location_id' => $target->location_id,
                        'quantity' => $movedQty,
                        'notes' => 'Night Compaction: Konsolidasi stok terfragmentasi',
                    ]);

                    // Move stock
                    $target->quantity += $movedQty;
                    $source->quantity = 0;
                    $source->save();

                    $consolidations++;
                    $msg = "Pindah {$movedQty} unit dari LOC:{$source->location_id} ke LOC:{$target->location_id}";
                    $this->line("  ✓ {$msg}");
                    $logs[] = ['phase' => 1, 'action' => 'STOCK_MOVED', 'message' => $msg, 'qty' => $movedQty];
                }

                $target->last_updated = now();
                $target->save();
            }

            $this->info("  Konsolidasi selesai: {$consolidations} perpindahan.");
            $logs[] = ['phase' => 1, 'action' => 'CONSOLIDATION_DONE', 'message' => "{$consolidations} stok dikonsolidasi"];

            // =============================================
            // PHASE 2: CLEANUP EMPTY STOCK RECORDS
            // Hapus record stok dengan quantity 0
            // =============================================
            $this->info("\n[PHASE 2] Cleaning up empty stock records...");
            $cleaned = InventoryStock::where('quantity', 0)->delete();
            $this->info("  {$cleaned} record stok kosong dibersihkan.");
            $logs[] = ['phase' => 2, 'action' => 'CLEANUP', 'message' => "{$cleaned} record stok kosong dihapus"];

            // =============================================
            // PHASE 3: SPACE UTILIZATION REPORT
            // Hitung utilisasi ruang gudang
            // =============================================
            $this->info("\n[PHASE 3] Generating space utilization report...");

            $totalLocations = Location::where('is_active', true)->count();
            $occupiedLocations = InventoryStock::where('quantity', '>', 0)
                ->distinct('location_id')
                ->count('location_id');
            $emptyLocations = $totalLocations - $occupiedLocations;
            $utilization = $totalLocations > 0 ? round(($occupiedLocations / $totalLocations) * 100, 1) : 0;

            $this->info("  Total Lokasi Aktif : {$totalLocations}");
            $this->info("  Lokasi Terisi      : {$occupiedLocations}");
            $this->info("  Lokasi Kosong      : {$emptyLocations}");
            $this->info("  Utilisasi Ruang    : {$utilization}%");

            $logs[] = [
                'phase' => 3,
                'action' => 'UTILIZATION_REPORT',
                'message' => "Utilisasi: {$utilization}%",
                'data' => [
                    'total_locations' => $totalLocations,
                    'occupied' => $occupiedLocations,
                    'empty' => $emptyLocations,
                    'utilization_pct' => $utilization,
                ]
            ];

            DB::commit();

            $this->info("\n========================================");
            $this->info(' NIGHT COMPACTION COMPLETED SUCCESSFULLY');
            $this->info(' Finished at: ' . now()->toDateTimeString());
            $this->info('========================================');

            return $logs;

        } catch (\Exception $e) {
            DB::rollBack();
            $this->error("Night Compaction FAILED: " . $e->getMessage());
            $logs[] = ['phase' => 0, 'action' => 'ERROR', 'message' => $e->getMessage()];
            return $logs;
        }
    }
}
