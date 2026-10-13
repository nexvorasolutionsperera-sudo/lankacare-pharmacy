# 🏥 LankaCare Pharmacy Management & POS System
**ශ්‍රී ලංකාවේ ඔසුසල් සඳහා විශේෂයෙන් නිර්මාණය කරන ලද නවීන ඖෂධ කළමනාකරණ පද්ධතිය**

---

## 🌟 ප්‍රධාන විශේෂාංග (Key Features)

### 1. 🛒 POS Billing Counter (බිල්පත් නිකුත් කිරීමේ කවුන්ටරය)
* ඖෂධ නාමය (Brand Name), Generic නාමය හෝ Barcode මඟින් ක්ෂණිකව සෙවීම (Instant Search).
* එක් එක් ඖෂධයේ තොග ප්‍රමාණය (Live Stock Level) සහ කල් ඉකුත්වීමේ දින පෙන්වීම.
* පාරිභෝගිකයා (Customer/Patient) සහ නිර්දේශ කල වෛද්‍යවරයා (Prescribing Doctor) තෝරා ගැනීමේ පහසුකම.
* Discount %, Subtotal, මුළු එකතුව, ලබාදුන් මුදල (Tendered Cash) සහ ඉතිරි මුදල (Change) ස්වයංක්‍රීයව ගණනය වීම.
* බිල අවසන් කළ වහාම 80mm Thermal Receipt (මුද්‍රිත බිල්පතක්) ක්ෂණිකව Print කිරීමේ හැකියාව.

### 2. 💊 Medicine Inventory (බෙහෙත් තොග කළමනාකරණය)
* නව ඖෂධ එකතු කිරීම, සංස්කරණය (Edit) සහ මකාදැමීම (Delete).
* Batch අංකය, Rack/Shelf Location (රාක්ක අංකය), Cost Price (ගැණුම් මිල), Selling Price (විකුණුම් මිල) සහ Profit Margin %.
* Reorder level (අවම තොග මට්ටම) සටහන් කර තැබීම.

### 3. 🚚 Dealers & Suppliers Management (ඩීලර්ස් සහ සැපයුම්කරුවන්)
* සියලුම ඖෂධ බෙදාහරින සමාගම් (Hemas, SPC, Baurs, George Steuart ආදී) ලියාපදිංචි කිරීම.
* **Dealer Stock Inward (GRN):** ඩීලර් වෙතින් ලැබුණු බෙහෙත් තොග පද්ධතියට ඇතුලත් කිරීමෙන් Inventory එක ස්වයංක්‍රීයව Update වීම.
* **Dealer Dues Tracking:** එක් එක් ඩීලර්ට ගෙවීමට ඇති හිඟ මුදල් (Outstanding Due Balance) සහ ගෙවීම් පියවීම (Pay Dealer).

### 4. ⚠️ Alerts Hub (අනතුරු ඇඟවීම් මධ්‍යස්ථානය)
* **Expired Medicines:** කල් ඉකුත් වූ ඖෂධ හඳුනාගෙන වෙන් කර තැබීමට අනතුරු ඇඟවීම්.
* **Expiring Soon:** ඉදිරි දින 60 ඇතුළත කල් ඉකුත් වීමට නියමිත ඖෂධ ලැයිස්තුව.
* **Low Stock Alerts:** තොග අවසන් වීමට ආසන්න බෙහෙත් වර්ග (Reorder level එකට වඩා අඩු ඒවා).

### 5. 👥 Patients & Doctors Management (පාරිභෝගික සහ වෛද්‍ය තොරතුරු)
* රෝගීන්ගේ නම, දුරකථන අංකය සහ විශේෂයෙන් **Drug Allergies (ඖෂධ අසාත්මිකතා)** සටහන් කර තැබීම.
* වෛද්‍යවරුන්ගේ SLMC අංකය, රෝහල සහ විශේෂඥතාව සටහන් කර තැබීම.

### 6. 📊 Reports & Profit Analytics (විකුණුම් සහ ලාභ වාර්තා)
* දෛනික, සතිපතා, මාසික විකුණුම් වාර්තා.
* දළ ලාභය (Gross Profit) සහ Margin % ගණනය කිරීම.
* වැඩිපුරම අලෙවි වූ ඖෂධ (Top-Selling Medicines).
### 7. 🔐 User Authentication & Login (පරිශීලක පිවිසුම)
* පරිශීලක නාමය (Username) සහ මුරපදය (Password) මඟින් ආරක්ෂිතව පද්ධතියට පිවිසීමේ හැකියාව.
* Show/Hide Password, Remember Me සහ Logout පහසුකම්.

#### 🔑 පෙරනිමි පිවිසුම් තොරතුරු (Default Login Credentials):
| Role / කාර්යභාරය | පරිශීලක නාමය (Username) | මුරපදය (Password) |
|---|---|---|
| **Administrator / Pharmacist** | `admin` | `admin123` |
| **Counter Cashier** | `cashier` | `cashier123` |

*(Login පිටුවේ ඇති Quick Fill බොත්තම් මඟින් එක click එකකින් තොරතුරු ස්වයංක්‍රීයව පුරවා පිවිසිය හැක)*

### 8. 🌐 Sinhala + English Dual Language (ද්විභාෂා පහසුකම)
* Navbar එකෙහි ඇති **සිංහල / English** බොත්තම මඟින් එක ක්ලික් එකකින් මුළු පද්ධතියේම භාෂාව මාරු කළ හැක.

### 9. 🌓 Dark Mode + Light Mode (දිවා / රාත්‍රී තේමාව)
* රාත්‍රී සේවා කාලය සඳහා ඇස්වලට පහසු **Dark Mode** සහ පිරිසිදු **Light Mode** අතර මාරු වීමේ හැකියාව (Sun/Moon බොත්තම).

### 10. 🎨 Background Themes (පසුබිම් මෝස්තර 5ක්)
* Navbar එකෙහි ඇති Palette අයිකනය මඟින් පසුබිම වෙනස් කළ හැක:
  - 🌿 **Emerald Mint** (පෙරනිමි ඔසුසල් තේමාව)
  - 🏥 **Hospital Azure** (ක්ලිනික් නිල් තේමාව)
  - 🌌 **Midnight Slate** (වෘත්තීය අඳුරු තේමාව)
  - 💜 **Soft Lavender** (මෘදු ලැවෙන්ඩර් තේමාව)
  - 🍯 **Warm Amber** (උණුසුම් ඇම්බර් තේමාව)

### 11. 📄 PDF Generation & Download (PDF වාර්තා සහ බිල්පත්)
* **Bill / Receipt PDF:** බිල්පත් මුද්‍රණය කිරීමට අමතරව 80mm PDF receipt එකක් ලෙස Download කිරීමේ හැකියාව.
* **Sales Performance Report PDF:** තෝරාගත් දින පරාසයේ සම්පූර්ණ විකුණුම් සහ ලාභ විස්තර PDF වාර්තාවක් ලෙස ලබාගැනීම.
* **Inventory Stock Audit PDF:** සම්පූර්ණ බෙහෙත් තොග, කල් ඉකුත්වීම් සහ අඩු තොග විස්තර PDF වාර්තාවක් ලෙස Export කර ගැනීම.

---

## 🚀 පද්ධතිය ක්‍රියාත්මක කරන්නේ කෙසේද? (How to Run)

### ක්‍රමය 1: සරලවම Double-Click කිරීමෙන් (Easiest Way)
`Pharmacy` ෆෝල්ඩරයේ ඇති **`Start-Pharmacy.bat`** file එක double-click කරන්න.
පද්ධතිය ආරම්භ වී ඔබගේ Browser එකෙහි `http://localhost:5000` ලිපිනයෙන් විවෘත වේ.

### ක්‍රමය 2: Terminal / Command Prompt හරහා
```bash
# පද්ධතිය ආරම්භ කිරීමට:
node server/server.js
```
ඉන්පසු බ්‍රවුසරයෙන් [http://localhost:5000](http://localhost:5000) වෙත පිවිසෙන්න.

---

## 🛠️ තාක්ෂණික විස්තර (Tech Stack)
* **Frontend:** React 19 + Tailwind CSS + Lucide Icons + Vite
* **Backend:** Node.js + Express 5
* **Database:** SQLite (Better-SQLite3) - සැහැල්ලු, වේගවත්, පරිගණකයේම දත්ත සුරැකෙන DB එකක්
