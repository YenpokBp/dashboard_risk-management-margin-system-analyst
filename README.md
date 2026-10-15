# EWF Risk - Kalkulator Kondisi Dana

Prototype kalkulator kondisi dana (Gold, Nikkei, Hang Seng). Tanpa database: seluruh perhitungan dijalankan langsung di backend.

## Struktur
```
ewf-risk/
  backend/            Node.js + Express, pola MVC
    server.js         titik masuk (npm start)
    src/
      config/         businessRules.js  -> semua angka bisnis (70%, 30%, $100/poin, $1.000/lot)
      routes/         daftar endpoint
      controllers/    menerima request, memanggil model, mengirim response
      models/         FundCondition.js  -> rumus perhitungan (decimal.js)
      views/          bentuk JSON respons
      middleware/     validasi input dan penanganan error
    test/             unit test rumus
  frontend/           HTML + Tailwind CSS + JavaScript (tanpa framework)
```

## Menjalankan
```
cd backend
npm install
npm start          # buka http://localhost:3000
npm test           # unit test rumus
```
Frontend disajikan oleh Express, jadi cukup buka http://localhost:3000. Jangan membuka index.html langsung dari folder karena tidak akan terhubung ke backend.

## API
- `GET /api/instruments` : daftar instrumen dan parameter kontrak
- `POST /api/calculate` : body `{instrument, side, balance, lot, entryPrice, currentPrice, pointValue?, marginPerLot?}`

Angka dikirim sebagai string dengan titik desimal (contoh `"4137.45"`).

## Rumus
Floating P/L = (Current - Entry) x Lot x Nilai per poin (dibalik untuk Sell). Equity = New Balance + Floating. MR = Lot x jaminan per lot. Effective Margin = Equity - MR. Equity Ratio = Equity / MR x 100%. Call Margin Price saat Equity = 70% x MR, Auto Liquidation Price saat Equity = 30% x MR (dibulatkan ke bawah 2 desimal).

## Belum terkonfirmasi
New Balance = modal yang diinput (belum menghitung P/L settled, facility fee, VAT). Aturan pembulatan untuk Sell. Nilai per poin dan jaminan Nikkei serta Hang Seng.
