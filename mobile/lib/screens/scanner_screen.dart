import 'package:flutter/material.dart';
// import 'package:mobile_scanner/mobile_scanner.dart'; // Uncomment after installing package
// import 'package:vibration/vibration.dart'; // Uncomment for haptic feedback
import '../core/api_service.dart';

class ScannerScreen extends StatefulWidget {
  final String taskType;
  const ScannerScreen({super.key, required this.taskType});

  @override
  State<ScannerScreen> createState() => _ScannerScreenState();
}

class _ScannerScreenState extends State<ScannerScreen> {
  String scannedLocation = '';
  String locationId = '';
  List<Map<String, dynamic>> scannedItems = [];
  bool isProcessing = false;
  
  // Dummy override for PC testing without real camera
  final TextEditingController _dummyController = TextEditingController();

  void _onDetect(String barcode) async {
    if (isProcessing) return;
    
    // Simulate Haptic Feedback
    // if (await Vibration.hasVibrator()) Vibration.vibrate(duration: 50);

    setState(() => isProcessing = true);

    try {
      if (scannedLocation.isEmpty) {
        // Step 1: Scan Location Barcode
        final result = await ApiService.validateLocation(barcode);
        setState(() {
          scannedLocation = result['location']['name'];
          locationId = result['location']['id'];
        });
        _showSnack('Lokasi Valid: $scannedLocation', Colors.green);
      } else {
        // Step 2: Scan Product Barcode
        setState(() {
          scannedItems.add({'barcode': barcode, 'quantity': 1}); // Default qty 1
        });
        _showSnack('Produk Ditambahkan: $barcode', Colors.blue);
      }
    } catch (e) {
      _showSnack('Ditolak: $e', Colors.red);
    } finally {
      setState(() => isProcessing = false);
      _dummyController.clear();
    }
  }

  Future<void> _submitPutaway() async {
    if (locationId.isEmpty || scannedItems.isEmpty) return;
    setState(() => isProcessing = true);
    try {
      final res = await ApiService.submitPutaway(locationId, scannedItems);
      _showSnack('Sukses! TRX: ${res['transaction_code']}', Colors.green);
      Navigator.pop(context); // Go back to home
    } catch (e) {
      _showSnack('Gagal Submit: $e', Colors.red);
      setState(() => isProcessing = false);
    }
  }

  void _showSnack(String msg, Color color) {
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(msg), backgroundColor: color, duration: const Duration(seconds: 2)));
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('${widget.taskType.toUpperCase()} SCANNER')),
      body: Column(
        children: [
          // Camera Viewport Simulation
          Expanded(
            flex: 2,
            child: Container(
              color: Colors.black,
              child: Stack(
                alignment: Alignment.center,
                children: [
                  /* 
                    In real app, place MobileScanner here:
                    MobileScanner(onDetect: (capture) {
                       final List<Barcode> barcodes = capture.barcodes;
                       for (final barcode in barcodes) { _onDetect(barcode.rawValue!); }
                    }),
                  */
                  const Center(child: Text('CAMERA VIEWPORT\n(Install MobileScanner to activate)', textAlign: TextAlign.center, style: TextStyle(color: Colors.white54, letterSpacing: 1))),
                  // Reticle overlay
                  Container(
                    width: 250, height: 250,
                    decoration: BoxDecoration(border: Border.all(color: Colors.green, width: 2), borderRadius: BorderRadius.circular(12)),
                  ),
                ],
              ),
            ),
          ),
          
          // Data Panel
          Expanded(
            flex: 3,
            child: Container(
              padding: const EdgeInsets.all(20),
              width: double.infinity,
              decoration: BoxDecoration(
                color: Theme.of(context).colorScheme.surface, 
                borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
                boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.5), blurRadius: 10, offset: const Offset(0, -5))]
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Icon(Icons.looks_one, color: scannedLocation.isEmpty ? Colors.amber : Colors.grey),
                      const SizedBox(width: 8),
                      Text('Scan Barcode Rak', style: TextStyle(color: scannedLocation.isEmpty ? Colors.amber : Colors.grey, fontWeight: FontWeight.bold)),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      Icon(Icons.looks_two, color: scannedLocation.isNotEmpty ? Colors.amber : Colors.grey),
                      const SizedBox(width: 8),
                      Text('Scan Barcode Produk', style: TextStyle(color: scannedLocation.isNotEmpty ? Colors.amber : Colors.grey, fontWeight: FontWeight.bold)),
                    ],
                  ),
                  const Divider(height: 30),
                  
                  Text('Lokasi Target: ${scannedLocation.isEmpty ? "-" : scannedLocation}', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                  const SizedBox(height: 8),
                  Text('Item Palet: ${scannedItems.length} SKU dipindai'),
                  
                  const Spacer(),
                  
                  // DUMMY INPUT FOR PC TESTING
                  TextField(
                    controller: _dummyController,
                    decoration: InputDecoration(
                      labelText: 'Simulasi Input Barcode Manual',
                      suffixIcon: IconButton(icon: const Icon(Icons.send, color: Colors.indigoAccent), onPressed: () => _onDetect(_dummyController.text)),
                      border: const OutlineInputBorder(),
                      filled: true,
                    ),
                    onSubmitted: _onDetect,
                  ),
                  const SizedBox(height: 16),
                  
                  SizedBox(
                    width: double.infinity,
                    height: 55,
                    child: ElevatedButton(
                      style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF6366F1), foregroundColor: Colors.white, shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12))),
                      onPressed: (scannedLocation.isNotEmpty && scannedItems.isNotEmpty && !isProcessing) ? _submitPutaway : null,
                      child: isProcessing 
                        ? const CircularProgressIndicator(color: Colors.white) 
                        : const Text('SUBMIT PUTAWAY', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16, letterSpacing: 1)),
                    ),
                  )
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
