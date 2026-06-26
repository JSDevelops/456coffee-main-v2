package com.paygate.smsforwarder

import android.content.Context
import android.content.Intent
import android.provider.Settings
import android.service.notification.NotificationListenerService
import android.service.notification.StatusBarNotification
import android.text.TextUtils
import android.util.Log
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch

/**
 * Notification Listener - ดักจับ Push Notification จากแอปธนาคาร
 */
class NotificationListener : NotificationListenerService() {

    companion object {
        private const val TAG = "NotificationListener"
        private const val GMAIL_PACKAGE_PREFIX = "com.google.android.gm"
        private val MONEY_PATTERN = Regex("""(?:THB|฿)\s*\d{1,3}(?:,\d{3})*(?:\.\d{1,2})?""", RegexOption.IGNORE_CASE)
        private val SCB_ALERT_HINTS = listOf(
            "scb business alert",
            "transaction notification",
            "เงินโอนเข้าบัญชี",
            "จำนวนเงิน",
            "amount (currency)",
            "transfer deposit"
        )

        fun isEnabled(context: Context): Boolean {
            val pkgName = context.packageName
            val flat = Settings.Secure.getString(
                context.contentResolver,
                "enabled_notification_listeners"
            )
            return !TextUtils.isEmpty(flat) && flat.contains(pkgName)
        }

        fun openSettings(context: Context) {
            context.startActivity(
                Intent(Settings.ACTION_NOTIFICATION_LISTENER_SETTINGS)
                    .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            )
        }

        private fun isScbBusinessAlertGmail(message: String): Boolean {
            val normalized = message.lowercase()
            val hasScbHint = normalized.contains("scb business alert") || normalized.contains("ไทยพาณิชย์")
            val hasTransactionHint = SCB_ALERT_HINTS.any { normalized.contains(it) }
            val hasAmount = MONEY_PATTERN.containsMatchIn(message) || normalized.contains("จำนวนเงิน")
            return hasScbHint && hasTransactionHint && hasAmount
        }
    }

    override fun onNotificationPosted(sbn: StatusBarNotification) {
        val packageName = sbn.packageName

        // ตรวจสอบว่า Service เปิดอยู่
        val prefs = applicationContext.getSharedPreferences("PayGateSMS", Context.MODE_PRIVATE)
        if (!prefs.getBoolean("enabled", true)) return
        if (!prefs.getBoolean("notification_enabled", true)) return

        // ตรวจสอบว่าเป็นแอปธนาคาร (ย้ายไปตรวจสอบทีหลัง)
        // if (!BankDetector.isBankApp(packageName)) return

        val notification = sbn.notification
        val extras = notification.extras

        val title = extras.getCharSequence("android.title")?.toString() ?: ""
        val text = extras.getCharSequence("android.text")?.toString() ?: ""
        val bigText = extras.getCharSequence("android.bigText")?.toString() ?: ""
        val subText = extras.getCharSequence("android.subText")?.toString() ?: ""
        val summaryText = extras.getCharSequence("android.summaryText")?.toString() ?: ""
        val infoText = extras.getCharSequence("android.infoText")?.toString() ?: ""
        val textLines = extras.getCharSequenceArray("android.textLines")
            ?.map { it.toString() }
            ?.filter { it.isNotBlank() }
            ?.joinToString(" | ")
            ?: ""

        // รวมข้อความทั้งหมด
        val fullMessage = listOf(title, text, bigText, subText, summaryText, infoText, textLines)
            .filter { it.isNotEmpty() }
            .joinToString(" | ")

        if (fullMessage.isBlank()) {
            return
        }

        // Gmail push: รับเฉพาะข้อความ SCB Business Alert ที่มีรูปแบบการเงินชัดเจน
        if (packageName.startsWith(GMAIL_PACKAGE_PREFIX)) {
            if (!isScbBusinessAlertGmail(fullMessage)) {
                Log.d(TAG, "Ignored Gmail notification (not SCB Business Alert): $fullMessage")
                CoroutineScope(Dispatchers.IO).launch {
                    ApiHelper.saveLog(
                        applicationContext,
                        "GMAIL",
                        fullMessage,
                        "gmail_push",
                        "IGNORED_GMAIL_NON_SCB_ALERT"
                    )
                }
                return
            }

            Log.d(TAG, "SCB Business Alert detected from Gmail push")
            CoroutineScope(Dispatchers.IO).launch {
                val result = ApiHelper.sendToApi(
                    context = applicationContext,
                    sender = "SCB",
                    message = fullMessage,
                    timestamp = sbn.postTime,
                    source = "gmail_push",
                    packageName = packageName
                )

                result.onSuccess {
                    Log.d(TAG, "Gmail push forwarded successfully. Matched: ${it.matched}")
                }.onFailure {
                    Log.e(TAG, "Failed to forward Gmail push: ${it.message}")
                }
            }
            return
        }

        // ตรวจสอบว่าเป็นข้อความเงินเข้าหรือไม่
        val isIncome = BankDetector.isIncomeMessage(fullMessage)
        val isTransaction = BankDetector.isTransactionMessage(fullMessage)

        val knownBank = BankDetector.getBankFromPackage(packageName)
        val detectedBank = knownBank ?: BankDetector.detectBankFromNotification(packageName, fullMessage)

        // ตรวจสอบว่าเป็นแอปธนาคาร
        if (detectedBank == null) {
            if (isIncome) {
                Log.w(TAG, "Ignored potential income message from unknown app: $packageName | $fullMessage")
                // Optional: Save to local logs for user to see
                CoroutineScope(Dispatchers.IO).launch {
                     ApiHelper.saveLog(
                        applicationContext,
                        "Unknown ($packageName)",
                        fullMessage,
                        "push_notification",
                        getString(R.string.log_ignored_unknown)
                     )
                }
            }
            return
        }
        
        Log.d(TAG, "Notification from $packageName: $fullMessage")

        // SCB Anywhere บางเวอร์ชันใช้ข้อความที่ไม่ติด keyword เดิม
        // ถ้าเป็น SCB และมี hint ทางการเงิน ให้ส่งต่อได้
        val shouldForward = isIncome ||
            isTransaction ||
            (detectedBank.code == "SCB" && BankDetector.hasMoneyHint(fullMessage))

        // ส่งเมื่อเป็นรายการธุรกรรมเข้า/ออก
        if (shouldForward) {
            val bankCode = detectedBank.code

            Log.d(TAG, "Transaction notification detected from $bankCode! (income=$isIncome, transaction=$isTransaction)")

            CoroutineScope(Dispatchers.IO).launch {
                val result = ApiHelper.sendToApi(
                    context = applicationContext,
                    sender = bankCode,
                    message = fullMessage,
                    timestamp = sbn.postTime,
                    source = "push_notification",
                    packageName = packageName
                )

                result.onSuccess {
                    Log.d(TAG, "Notification forwarded successfully. Matched: ${it.matched}")
                }.onFailure {
                    Log.e(TAG, "Failed to forward notification: ${it.message}")
                }
            }
        } else {
            Log.d(TAG, "Ignored non-transaction notification from $packageName")
            CoroutineScope(Dispatchers.IO).launch {
                ApiHelper.saveLog(
                    applicationContext,
                    detectedBank.code,
                    fullMessage,
                    "push_notification",
                    "IGNORED_NON_TRANSACTION"
                )
            }
        }
    }

    override fun onNotificationRemoved(sbn: StatusBarNotification) {
        // ไม่ต้องทำอะไร
    }
}
