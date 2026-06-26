# 456 Cafe Payment Bridge - Android App

แอป Android สำหรับดักจับ SMS และ Push Notification จากธนาคาร แล้วส่งเข้า backend ของ 456 Cafe เพื่อจับคู่รายการโอนกับออเดอร์ `QR/TRANSFER` ที่ยังไม่ชำระ

## 📱 Features

- ✅ **ดักจาก Push Notification** - เร็วกว่า SMS มาก!
- ✅ **ดัก Gmail Push (SCB Business Alert)** - คัดเฉพาะแจ้งเตือนธุรกรรมที่เกี่ยวข้อง
- ✅ **ดักจาก SMS** - รองรับ SMS Banking
- ✅ **Dark Mode UI** - สวยงาม ใช้งานง่าย
- ✅ รองรับธนาคารทุกแห่งในไทย 15+ ธนาคาร
- ✅ รองรับ TrueMoney, LINE BK
- ✅ ส่งข้อมูลไปยัง API ทันที
- ✅ Secret Key สำหรับความปลอดภัย
- ✅ แสดงประวัติการส่ง + สถานะ
- ✅ ทำงาน Background ตลอดเวลา
- ✅ Auto-start เมื่อเปิดเครื่อง

## 📸 Screenshots

```
┌──────────────────────────────────┐
│  🔔 Hyronpay SMS Forwarder       │
├──────────────────────────────────┤
│  ┌────────────────────────────┐  │
│  │  ✅ กำลังทำงาน        [ON] │  │
│  │  ดักจับ SMS และ Notification │  │
│  └────────────────────────────┘  │
│                                  │
│  แหล่งที่มา                       │
│  ┌────────────────────────────┐  │
│  │ 📱 SMS              [ON]  │  │
│  │ 🔔 Push Notification [ON]  │  │
│  └────────────────────────────┘  │
│                                  │
│  ตั้งค่า API                      │
│  ┌────────────────────────────┐  │
│  │ URL: https://pay.example.com│  │
│  │ Key: ••••••••••            │  │
│  │                            │  │
│  │ [  ทดสอบการเชื่อมต่อ  ✅ ]  │  │
│  └────────────────────────────┘  │
│                                  │
│  ประวัติการส่ง (5)               │
│  ┌────────────────────────────┐  │
│  │ 🔔 KBANK    14:30:25       │  │
│  │ รับโอน 500.00 บ...         │  │
│  │ SUCCESS                    │  │
│  └────────────────────────────┘  │
└──────────────────────────────────┘
```

## 🏦 ธนาคารที่รองรับ

| ธนาคาร | SMS | Push Notification |
|--------|:---:|:-----------------:|
| SCB Easy | ✅ | ✅ |
| K PLUS (KBANK) | ✅ | ✅ |
| Krungthai NEXT | ✅ | ✅ |
| Bangkok Bank | ✅ | ✅ |
| Krungsri (KMA) | ✅ | ✅ |
| GSB Mobile | ✅ | ✅ |
| ttb touch | ✅ | ✅ |
| CIMB Thai | ✅ | ✅ |
| KKP Mobile | ✅ | ✅ |
| UOB TMRW | ✅ | ✅ |
| TISCO Mobile | ✅ | ✅ |
| LH Bank | ✅ | ✅ |
| LINE BK | ❌ | ✅ |
| TrueMoney | ❌ | ✅ |

## 🔧 วิธี Build

### Prerequisites
- Android Studio Arctic Fox หรือใหม่กว่า
- JDK 17+
- Android SDK 34

### Build APK

```bash
cd sms-forwarder

# Build Debug APK
./gradlew assembleDebug

# APK จะอยู่ที่ app/build/outputs/apk/debug/app-debug.apk
```

### Build Release APK

```bash
# สร้าง keystore (ครั้งแรก)
keytool -genkey -v -keystore paygate.keystore -alias paygate -keyalg RSA -keysize 2048 -validity 10000

# Build Release
./gradlew assembleRelease
```

## 📲 วิธีติดตั้ง

1. เปิด "Unknown Sources" ใน Settings > Security
2. โอน APK ไปยังเครื่อง Android
3. ติดตั้ง APK
4. ให้สิทธิ์ SMS เมื่อถูกถาม

## ⚙️ การตั้งค่า

1. เปิดแอป 456 Cafe Payment Bridge
2. ใส่ **API URL**: `https://your-domain.com` (ไม่ต้องใส่ `/api`)
3. ล็อกอินด้วย **App Username/Password** ที่ผู้ดูแลสร้างไว้สำหรับเครื่อง Android นี้
4. กด **"ทดสอบการเชื่อมต่อ"**
5. เปิดสวิตช์เพื่อเริ่มทำงาน

> ถ้าใช้งานจริงมี Android forwarder แค่เครื่องเดียว ให้สร้าง credential เพียงชุดเดียวสำหรับเครื่องนั้นได้เลย ไม่ต้องมีขั้นตอนเลือกสาขาบนตัวแอป

## 🔐 Backend Configuration

เพิ่มใน `.env` ของ backend:

```env
JWT_SECRET=replace-with-random-64-char-secret
```

## 📡 API Endpoints

### Test Connection
```
GET /api/sms/test
Headers: Authorization: Bearer <app_user_jwt>
```

### Send SMS
```
POST /api/sms/incoming
Headers: 
  Authorization: Bearer <app_user_jwt>
  Content-Type: application/json
Body:
{
  "sender": "SCB",
  "message": "SCB: รับโอน 100.00 บ. จาก xxx",
  "timestamp": "2024-01-01T12:00:00Z",
  "deviceId": "Pixel 6",
  "source": "push_notification|gmail_push",
  "packageName": "com.google.android.gm"
}
```

### Gmail Push Filter (SCB Business Alert)
แอปจะส่งต่อเฉพาะ notification จาก `com.google.android.gm*` ที่มี pattern SCB Business Alert + amount เท่านั้น เพื่อลด false positive

## ⚠️ ข้อควรระวัง

1. **ต้องเปิดแอปไว้ตลอด** - ไม่ควรปิดแอปหรือ Force Stop
2. **ปิด Battery Optimization** - Settings > Apps > 456 Cafe Payment Bridge > Battery > Don't optimize
3. **เปิด Autostart** (บางเครื่อง) - สำหรับ Xiaomi, Huawei, OPPO ต้องเปิดสิทธิ์ Autostart
4. **ใช้ SIM ที่ลงทะเบียน SMS Banking** - SIM ที่รับ SMS แจ้งเตือนจากธนาคาร

## 🏦 SMS Format ที่รองรับ

### SCB
```
SCB: รับโอน 100.00 บ. จาก xxx เมื่อ 01/01/24 12:00 คงเหลือ xxx
```

### KBANK
```
รับโอน 100.00 บ. เข้าบัญชี xxx จาก xxx เมื่อ 01/01/24 12:00
```

### KTB
```
KTB: บัญชี xxx รับโอน 100.00 บาท จาก xxx วันที่ 01/01/24
```

### BBL
```
BBL: รับโอน 100.00 บาท เข้าบัญชี xxx
```

## 📁 Project Structure

```
sms-forwarder/
├── app/
│   ├── src/main/
│   │   ├── AndroidManifest.xml          # Permissions & Services
│   │   ├── res/
│   │   │   ├── values/
│   │   │   │   ├── colors.xml            # Color palette
│   │   │   │   ├── strings.xml           # String resources
│   │   │   │   └── themes.xml            # App theme
│   │   │   ├── drawable/                 # Icons & backgrounds
│   │   │   └── mipmap-anydpi-v26/        # Adaptive icons
│   │   └── java/com/paygate/smsforwarder/
│   │       ├── MainActivity.kt           # UI หลัก (Jetpack Compose)
│   │       ├── SmsReceiver.kt            # ดักจับ SMS
│   │       ├── NotificationListener.kt   # ดักจับ Push Notification
│   │       ├── SmsForwarderService.kt    # Foreground Service
│   │       ├── BootReceiver.kt           # Auto-start เมื่อเปิดเครื่อง
│   │       ├── ApiHelper.kt              # HTTP Client
│   │       └── BankDetector.kt           # ตรวจจับธนาคาร + กรองเฉพาะเงินเข้า
│   ├── build.gradle.kts
│   └── proguard-rules.pro
├── build.gradle.kts
├── settings.gradle.kts
├── gradle.properties
└── README.md
```

## 🛡️ Permissions ที่ต้องการ

| Permission | ใช้ทำอะไร |
|------------|----------|
| RECEIVE_SMS | รับ SMS จากธนาคาร |
| READ_SMS | อ่านเนื้อหา SMS |
| INTERNET | ส่งข้อมูลไป API |
| FOREGROUND_SERVICE | ทำงานเบื้องหลังตลอดเวลา |
| RECEIVE_BOOT_COMPLETED | เริ่มทำงานอัตโนมัติเมื่อเปิดเครื่อง |
| POST_NOTIFICATIONS | แสดง Notification (Android 13+) |
| BIND_NOTIFICATION_LISTENER_SERVICE | ดักจับ Notification จากแอปอื่น |

## 🔔 การตั้งค่า Push Notification (สำคัญ!)

เพื่อให้แอปดักจับ Push Notification จากแอปธนาคารได้:

1. เปิด **Settings > Apps > Special access > Notification access**
2. เปิด **456 Cafe Payment Bridge**
3. กด **Allow**

> ⚠️ หากไม่เปิดการเข้าถึง Notification จะดักจับได้เฉพาะ SMS เท่านั้น

## 🛑 วิธีแก้ปัญหา "App was denied access to SMS" (Restricted Settings)

หากติดตั้งด้วยไฟล์ APK (Sideload) บน Android 13+ หรือ ColorOS 16 แล้วขึ้นข้อความ "App was denied access to SMS" หรือ "Restricted Settings":

1. ไปที่ **Settings > Apps > 456 Cafe Payment Bridge**
2. กดที่จุด 3 จุดมุมขวาบน (เมนูเพิ่มเติม)
3. เลือก **"Allow restricted settings" (อนุญาตการตั้งค่าที่ถูกจำกัด)**
4. สแกนลายนิ้วมือหรือใส่รหัสผ่านเพื่อยืนยัน
5. กลับไปเปิดสิทธิ์ SMS ใหม่อีกครั้ง

## 🔄 Alternative: ใช้ Tasker/MacroDroid

หากไม่ต้องการ build แอปเอง สามารถใช้แอปสำเร็จรูปได้:

### Tasker
1. ติดตั้ง Tasker ($3.99)
2. Profile > Event > Phone > Received Text
3. Task > Net > HTTP Request
   - Method: POST
   - URL: https://your-domain.com/api/sms/incoming
   - Headers: Authorization: Bearer <app_user_jwt>
   - Body: {"sender":"%SMSRF","message":"%SMSRB"}

### MacroDroid (ฟรี)
1. ติดตั้ง MacroDroid
2. Trigger: SMS Received
3. Action: HTTP Request
4. ตั้งค่าเหมือน Tasker

## 📝 License

MIT License
