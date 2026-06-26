package com.paygate.smsforwarder

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.provider.Telephony
import android.util.Log
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch

/**
 * SMS Receiver - รับ SMS จากธนาคารและส่งไป API
 */
class SmsReceiver : BroadcastReceiver() {

    companion object {
        private const val TAG = "SmsReceiver"
    }

    override fun onReceive(context: Context, intent: Intent) {
        if (intent.action != Telephony.Sms.Intents.SMS_RECEIVED_ACTION) return

        // ตรวจสอบว่า Service เปิดอยู่
        val prefs = context.getSharedPreferences("PayGateSMS", Context.MODE_PRIVATE)
        if (!prefs.getBoolean("enabled", true)) return
        if (!prefs.getBoolean("sms_enabled", true)) return

        val messages = Telephony.Sms.Intents.getMessagesFromIntent(intent)
        if (messages.isEmpty()) return

        val sender = messages[0].originatingAddress ?: return
        val body = messages.joinToString("") { it.messageBody }
        val timestamp = messages[0].timestampMillis

        Log.d(TAG, "SMS received from: $sender")

        // ตรวจสอบว่าเป็น SMS จากธนาคารและเป็นเงินเข้า
        if (BankDetector.isBankSms(sender, body) && BankDetector.isIncomeMessage(body)) {
            val bankInfo = BankDetector.getBankFromSender(sender)
            val bankCode = bankInfo?.code ?: sender

            Log.d(TAG, "Bank SMS detected: $bankCode - forwarding...")

            CoroutineScope(Dispatchers.IO).launch {
                val result = ApiHelper.sendToApi(
                    context = context,
                    sender = bankCode,
                    message = body,
                    timestamp = timestamp,
                    source = "sms"
                )

                result.onSuccess {
                    Log.d(TAG, "SMS forwarded successfully. Matched: ${it.matched}")
                }.onFailure {
                    Log.e(TAG, "Failed to forward SMS: ${it.message}")
                }
            }
        }
    }
}
