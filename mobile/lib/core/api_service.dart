import 'dart:convert';
import 'package:http/http.dart' as http;

class ApiService {
  // Use 10.0.2.2 for Android Emulator, or your local IP if testing on real device
  static const String baseUrl = 'http://10.0.2.2:8000/api'; 
  
  static Future<Map<String, dynamic>> validateLocation(String barcode) async {
    final response = await http.post(
      Uri.parse('$baseUrl/mobile/putaway/validate-location'),
      headers: {'Content-Type': 'application/json', 'Accept': 'application/json'},
      body: jsonEncode({'barcode': barcode}),
    );
    
    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    } else {
      throw Exception(jsonDecode(response.body)['message'] ?? 'Validation failed');
    }
  }

  static Future<Map<String, dynamic>> submitPutaway(String locationId, List<Map<String, dynamic>> scannedItems) async {
    final response = await http.post(
      Uri.parse('$baseUrl/mobile/putaway/submit'),
      headers: {'Content-Type': 'application/json', 'Accept': 'application/json'},
      body: jsonEncode({
        'location_id': locationId,
        'scanned_items': scannedItems
      }),
    );
    
    if (response.statusCode == 200 || response.statusCode == 201) {
      return jsonDecode(response.body);
    } else {
      throw Exception(jsonDecode(response.body)['message'] ?? 'Putaway submission failed');
    }
  }
}
