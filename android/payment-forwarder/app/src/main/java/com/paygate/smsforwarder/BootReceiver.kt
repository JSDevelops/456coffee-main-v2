package com.paygate.smsforwarder

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent

class BootReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        if (intent.action == Intent.ACTION_BOOT_COMPLETED) {
            // เริ่ม Foreground Service เมื่อเปิดเครื่อง
            val serviceIntent = Intent(context, SmsForwarderService::class.java)
            context.startForegroundService(serviceIntent)
        }
    }
}
