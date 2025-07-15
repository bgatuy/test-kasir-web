// ========== DATA & STATE ==========
let daftarProduk = JSON.parse(localStorage.getItem("produk")) || [];
let transaksi = [];
let histori = JSON.parse(localStorage.getItem("histori_transaksi")) || [];

// ========== HELPER ==========
function simpanProduk() {
  localStorage.setItem("produk", JSON.stringify(daftarProduk));
}

function simpanHistori() {
  localStorage.setItem("histori_transaksi", JSON.stringify(histori));
}

function formatRupiah(angka) {
  return 'Rp. ' + angka.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

function getToday() {
  const today = new Date();
  return today.toISOString().split("T")[0];
}

function showPage(nama) {
  document.querySelectorAll('.halaman').forEach(s => s.classList.remove('active'));
  document.getElementById(`halaman-${nama}`).classList.add('active');
}

window.onload = () => showPage('transaksi');

// ========== PRODUK ==========
const formProduk = document.getElementById("form-produk");
const produkBody = document.getElementById("produk-body");

formProduk.addEventListener("submit", function (e) {
  e.preventDefault();
  const nama = document.getElementById("nama").value.trim();
  const harga = parseInt(document.getElementById("harga").value);
  const stok = parseInt(document.getElementById("stok").value);

  if (!nama || isNaN(harga) || isNaN(stok)) return alert("Lengkapi data produk!");

  daftarProduk.push({ nama, harga, stok });
  simpanProduk();
  renderDaftarProduk();
  formProduk.reset();
});

function hapusProduk(index) {
  if (confirm("Yakin hapus produk ini?")) {
    daftarProduk.splice(index, 1);
    simpanProduk();
    renderDaftarProduk();
  }
}

function editProduk(index) {
  const produk = daftarProduk[index];
  const namaBaru = prompt("Edit nama produk:", produk.nama);
  const hargaBaru = prompt("Edit harga:", produk.harga);
  const stokBaru = prompt("Edit stok:", produk.stok);

  if (namaBaru !== null && hargaBaru !== null && stokBaru !== null) {
    produk.nama = namaBaru.trim();
    produk.harga = parseInt(hargaBaru);
    produk.stok = parseInt(stokBaru);
    simpanProduk();
    renderDaftarProduk();
  }
}

function renderDaftarProduk() {
  produkBody.innerHTML = "";
  daftarProduk.forEach((p, i) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${p.nama}</td>
      <td>${formatRupiah(p.harga)}</td>
      <td>${p.stok}</td>
      <td>
        <button onclick="editProduk(${i})">Edit</button>
        <button onclick="hapusProduk(${i})">Hapus</button>
      </td>
    `;
    produkBody.appendChild(tr);
  });
  renderDropdownProduk();
}

function renderDropdownProduk() {
  const selectProduk = document.getElementById("pilihProduk");
  selectProduk.innerHTML = `<option value="">-- Pilih Produk --</option>`;
  daftarProduk.forEach((p, i) => {
    if (p.stok > 0) {
      const opt = document.createElement("option");
      opt.value = i;
      opt.textContent = `${p.nama} (${p.stok})`;
      selectProduk.appendChild(opt);
    }
  });
}

// ========== TRANSAKSI ==========
const inputHarga = document.getElementById("hargaProduk");
const inputJumlah = document.getElementById("jumlahProduk");
const formTransaksi = document.getElementById("form-transaksi");
const tabelTransaksiBody = document.getElementById("tabelTransaksiBody");
const totalBelanjaSpan = document.getElementById("totalBelanja");

let selectProduk = document.getElementById("pilihProduk");
selectProduk.addEventListener("change", () => {
  const idx = selectProduk.value;
  inputHarga.value = idx !== "" ? daftarProduk[idx].harga : "";
});

formTransaksi.addEventListener("submit", function (e) {
  e.preventDefault();
  const idx = selectProduk.value;
  const jumlah = parseInt(inputJumlah.value);

  if (idx === "" || isNaN(jumlah) || jumlah < 1) return alert("Isi jumlah dengan benar!");

  const produk = daftarProduk[idx];
  if (jumlah > produk.stok) return alert("Stok tidak cukup!");

  const subtotal = produk.harga * jumlah;
  transaksi.push({
    nama: produk.nama,
    harga: produk.harga,
    jumlah,
    subtotal,
    indexProduk: idx
  });

  renderTabelTransaksi();
  selectProduk.value = "";
  inputHarga.value = "";
  inputJumlah.value = "";
});

function editItemTransaksi(index) {
  const item = transaksi[index];
  const jumlahBaru = prompt("Edit jumlah untuk " + item.nama, item.jumlah);
  if (jumlahBaru !== null) {
    const jumlah = parseInt(jumlahBaru);
    if (!isNaN(jumlah) && jumlah > 0) {
      item.jumlah = jumlah;
      item.subtotal = jumlah * item.harga;
      renderTabelTransaksi();
    }
  }
}

function hapusItemTransaksi(index) {
  if (confirm("Hapus item dari transaksi?")) {
    transaksi.splice(index, 1);
    renderTabelTransaksi();
  }
}

function renderTabelTransaksi() {
  tabelTransaksiBody.innerHTML = "";
  let total = 0;

  transaksi.forEach((item, index) => {
    total += item.subtotal;
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${item.nama}</td>
      <td>${formatRupiah(item.harga)}</td>
      <td>${item.jumlah}</td>
      <td>${formatRupiah(item.subtotal)}</td>
      <td>
        <button onclick="editItemTransaksi(${index})">✏️</button>
        <button onclick="hapusItemTransaksi(${index})">🗑️</button>
      </td>
    `;
    tabelTransaksiBody.appendChild(tr);
  });

  totalBelanjaSpan.textContent = formatRupiah(total);
}

function selesaikanTransaksi() {
  if (transaksi.length === 0) return alert("Belum ada transaksi.");

  const tanggal = getToday();
  const waktu = new Date().toLocaleTimeString('id-ID');
  const total = transaksi.reduce((t, i) => t + i.subtotal, 0);
  const id = `TRX${tanggal.replace(/-/g, "")}-${(histori.length + 1).toString().padStart(3, '0')}`;

  transaksi.forEach(item => {
    const produk = daftarProduk[item.indexProduk];
    produk.stok -= item.jumlah;
  });
  simpanProduk();

  histori.push({
    id, tanggal, waktu,
    items: transaksi.map(({ nama, harga, jumlah, subtotal }) => ({ nama, harga, jumlah, subtotal })),
    total
  });
  simpanHistori();
  renderHistori();

  transaksi = [];
  renderTabelTransaksi();
  renderDaftarProduk();
  alert("Transaksi selesai!");
  showPage('transaksi');
}

// ========== HISTORI ==========
function renderHistori(filterHariIni = false) {
  const historiBody = document.getElementById("tabelHistoriBody");
  historiBody.innerHTML = "";
  const today = getToday();
  const data = filterHariIni ? histori.filter(t => t.tanggal === today) : histori;

  data.forEach((t) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${t.id}</td>
      <td>${t.tanggal}</td>
      <td>${t.waktu}</td>
      <td>${formatRupiah(t.total)}</td>
      <td><button onclick='alertDetailData(${JSON.stringify(t)})'>Lihat</button></td>
    `;
    historiBody.appendChild(tr);
  });
}

function alertDetailData(trx) {
  let detail = trx.items.map(i => `${i.nama} x${i.jumlah} = ${formatRupiah(i.subtotal)}`).join("\n");
  alert(`ID: ${trx.id}\nTanggal: ${trx.tanggal}\nWaktu: ${trx.waktu}\n\n${detail}\n\nTotal: ${formatRupiah(trx.total)}`);
}

function exportLaporanHariIni() {
  const tanggal = getToday();
  const dataHariIni = histori.filter(t => t.tanggal === tanggal);
  if (dataHariIni.length === 0) return alert("Belum ada transaksi hari ini.");

  const rows = [];
  dataHariIni.forEach(t => {
    t.items.forEach(i => {
      rows.push({
        ID_Transaksi: t.id,
        Waktu: t.waktu,
        Produk: i.nama,
        Harga: i.harga,
        Jumlah: i.jumlah,
        Subtotal: i.subtotal,
        Total_Transaksi: ""
      });
    });
    rows.push({
      ID_Transaksi: "",
      Waktu: "",
      Produk: "Total Transaksi",
      Harga: "",
      Jumlah: "",
      Subtotal: "",
      Total_Transaksi: t.total
    });
  });

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, `Laporan_${tanggal}`);
  XLSX.writeFile(workbook, `laporan_kasir_${tanggal}.xlsx`);
}

function filterHistoriHariIni() {
  renderHistori(true);
}

function tampilkanSemuaHistori() {
  renderHistori(false);
}

// ========== INIT ==========
renderDaftarProduk();
renderTabelTransaksi();
renderHistori();
