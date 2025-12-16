# 🐾 PetMap - Akıllı Şehir Hayvan Destek Platformu

PetMap, evcil hayvan sahipleri, veterinerler, barınaklar ve hayvanseverler için geliştirilmiş kapsamlı bir web platformudur. Yapay zeka destekli sağlık takibi, kayıp hayvan bildirimi ve gerçek zamanlı konum izleme özellikleri sunar.

## ✨ Özellikler

### 🐕 Evcil Hayvan Yönetimi
- Detaylı hayvan profilleri (isim, tür, cins, yaş, ağırlık, mikro

çip)
- Sağlık skoru takibi ve görselleştirme
- Aşı ve ilaç kayıtları
- Hastalık geçmişi ve alerji takibi
- Fotoğraf galerisi

### 🤖 AI Destekli Sağlık Asistanı
- **Fotoğraf Analizi**: Hayvan fotoğraflarını analiz ederek olası sağlık sorunlarını tespit eder
- **Sohbet Asistanı**: Sağlık, beslenme ve davranış konularında akıllı yanıtlar
- **Sağlık Trendi Analizi**: Ağırlık, aktivite ve iştah verilerini grafiklerle görselleştirir
- **Akıllı Öneriler**: Kişiselleştirilmiş bakım önerileri

> **Not**: Tüm AI özellikleri simüle edilmiştir ve harici API çağrısı yapmaz. Gerçek bir AI entegrasyonu için backend geliştirmesi gereklidir.

### 📍 PetMap - Konum Takibi
- Gerçek zamanlı harita üzerinde hayvan konumu
- Risk bölgesi görselleştirmesi
- Mesafe hesaplama ve uyarı sistemi
- POI (İlgi Noktaları) katmanları:
  - 🥣 Mama Otomatları
  - 🏥 Veterinerler
  - 🏠 Barınaklar
  - 🌳 Hayvan Parkları

### 📢 Kayıp/Buluntu Hayvan Bildirimi
- Fotoğraf yükleme ve otomatik konum etiketleme
- Barınak ile gerçek zamanlı sohbet
- Çoklu rapor yönetimi
- Rol tabanlı görünüm (Bulucu/Barınak)

### 👥 Kullanıcı Rolleri
- **Hayvan Sahibi**: Evcil hayvanlarını yönetir
- **Veteriner**: Sağlık kayıtlarına erişim
- **Hayvansever**: Kayıp hayvan bildirimi yapabilir
- **Barınak**: Bildirimleri alır ve koordinasyon sağlar

## 🚀 Kurulum

### Gereksinimler
- Python 3.7+ (sadece yerel sunucu için)
- Modern web tarayıcı (Chrome, Firefox, Edge)

### Adımlar

1. **Projeyi İndirin**
   ```bash
   git clone <repository-url>
   cd PetMap
   ```

2. **Sunucuyu Başlatın**
   ```bash
   python server.py
   ```

3. **Tarayıcıda Açın**
   ```
   http://localhost:8000
   ```

## 📁 Proje Yapısı

```
PetMap/
├── index.html              # Ana sayfa
├── login.html              # Giriş/Kayıt sayfası
├── pets.html               # Hayvan listesi
├── pet-detail.html         # Hayvan detay sayfası
├── server.py               # Basit HTTP sunucusu
├── js/                     # JavaScript dosyaları
│   ├── petmap_v2.js       # Ana uygulama mantığı
│   ├── pets.js            # Hayvan yönetimi
│   └── pet-detail.js      # Detay sayfası mantığı
├── css/                    # Stil dosyaları
│   ├── style.css          # Ana stiller
│   ├── pets.css           # Hayvan sayfası stilleri
│   └── animations.css     # Animasyonlar
└── assets/                 # Medya dosyaları
    └── img/
        └── hero.png       # Hero görseli
```

## 💻 Kullanım

### İlk Giriş
1. `http://localhost:8000` adresine gidin
2. "Giriş Yap" butonuna tıklayın
3. "Kayıt Ol" sekmesinden rolünüzü seçin ve kayıt olun
4. Otomatik olarak ana sayfaya yönlendirileceksiniz

### Hayvan Ekleme
1. "Evcil Hayvanlarım" sayfasına gidin
2. "Yeni Hayvan Ekle" butonuna tıklayın
3. Gerekli bilgileri doldurun
4. "Kaydet" butonuna tıklayın

### AI Sağlık Analizi
1. Bir hayvanın detay sayfasına gidin
2. "AI Sağlık Analizi Yap" butonuna tıklayın
3. Kapsamlı sağlık raporu görüntülenecektir

### Kayıp Hayvan Bildirimi
1. Ana sayfada "Kayıp / Buluntu Bildirimi" bölümüne gidin
2. Hayvanın fotoğrafını yükleyin
3. Konum otomatik olarak etiketlenecektir
4. Bildirimi gönderin
5. Barınak ile sohbet başlatılacaktır

## 🛠️ Teknoloji Stack

- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Harita**: Leaflet.js
- **Grafikler**: Chart.js
- **Sunucu**: Python HTTP Server
- **Veri Depolama**: LocalStorage (tarayıcı tabanlı)
- **Simüle AI**: Yerleşik yanıt sistemi

## 🔒 Güvenlik Notları

- Bu proje **demo amaçlıdır** ve production kullanımı için tasarlanmamıştır
- Kullanıcı verileri tarayıcının LocalStorage'ında saklanır
- Şifreler düz metin olarak saklanır (güvenli değil!)
- Production için:
  - Backend veritabanı (PostgreSQL, MongoDB)
  - Şifre hashleme (bcrypt)
  - JWT tabanlı kimlik doğrulama
  - HTTPS kullanımı gereklidir

## 🎨 Özelleştirme

### Renk Teması
`css/style.css` dosyasındaki CSS değişkenlerini düzenleyin:
```css
:root {
    --primary: #007bff;
    --success: #28a745;
    --danger: #dc3545;
    --warning: #ffc107;
}
```

### Varsayılan Konum
`js/petmap_v2.js` dosyasında harita merkez koordinatlarını değiştirin:
```javascript
const map = L.map('city-map').setView([40.9855, 29.0325], 13);
```

## 🐛 Bilinen Sorunlar

- AI özellikleri simüle edilmiştir, gerçek AI entegrasyonu yoktur
- Çoklu sekme desteği sınırlıdır (LocalStorage senkronizasyonu)
- Mobil responsive tasarım bazı sayfalarda optimize edilebilir

## 📝 Lisans

Bu proje eğitim ve demo amaçlıdır. Ticari kullanım için uygun değildir.

## 🤝 Katkıda Bulunma

1. Fork yapın
2. Feature branch oluşturun (`git checkout -b feature/amazing-feature`)
3. Değişikliklerinizi commit edin (`git commit -m 'Add amazing feature'`)
4. Branch'inizi push edin (`git push origin feature/amazing-feature`)
5. Pull Request açın

## 📧 İletişim

Sorularınız için: [email@example.com]

---

**PetMap** - Akıllı Şehir Hayvan Destek Platformu © 2024
